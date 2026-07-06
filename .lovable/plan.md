## Diagnóstico

Os dados no banco estão corretos:
- 743 contratos, 15.317 itens em `audit_checklist_items` (~20 por contrato).
- Contrato `5b5c0100…b8e7`: 21 itens, 19 preenchidos (12 ok / 7 nok). Campo é `status` com valores `ok` / `nok` / (nulo = pendente). Confere com o que a query espera.

O bug **não é** de nome de campo nem de tipo. É de **volume**:

Em `src/pages/auditoria/Auditoria.tsx` a carga faz:

```ts
supabase.from("audit_checklist_items")
  .select("contract_id, item_number, status")
  .in("contract_id", ids)   // ids = 743 UUIDs
```

Dois problemas simultâneos nessa chamada:
1. A URL com 743 UUIDs (~28 KB) estoura o limite do PostgREST e/ou é truncada — muitos contratos não voltam nenhum item.
2. Mesmo passando, PostgREST tem limite default de 1000 linhas por resposta; 743×~20 = 15k linhas, então >90% dos itens são descartados.

Resultado: `itemsByContract` fica quase vazio → progresso `0/0` para quase todos e KPIs (`completa`, `pendencia`, `alerta`) zerados. Mesmo problema afeta `audit_contract_extracted_data`, mas em menor grau (743 linhas, cabe).

## Correção

Trocar a agregação client-side por uma **view SQL** que devolve 1 linha por contrato já contada, evitando trafegar 15k itens.

### 1. Migração — criar view `audit_contract_progress`

```sql
create or replace view public.audit_contract_progress as
select
  c.id as contract_id,
  count(i.*)                                              as total_items,
  count(i.*) filter (where i.status = 'ok')               as ok_items,
  count(i.*) filter (where i.status = 'nok')              as nok_items,
  bool_or(i.status = 'nok' and i.item_number in (4,5,6,7)) as has_critical_nok
from public.audit_contracts c
left join public.audit_checklist_items i on i.contract_id = c.id
group by c.id;

grant select on public.audit_contract_progress to authenticated;
```

View herda RLS das tabelas base (já corretas). Nada é alterado em `audit_checklist_items` nem no fluxo de gravação.

### 2. `src/pages/auditoria/Auditoria.tsx`

- Remover o `select` grande de `audit_checklist_items` no `load()`.
- Adicionar em paralelo: `supabase.from("audit_contract_progress").select("*")` (743 linhas, sem `.in`).
- Popular `total_items`, `ok_items`, `nok_items` a partir da view.
- `risco_alto` = `has_critical_nok` **OU** divergência de garantidora (mantém `calcularRiscoAlto` só para a parte de garantidora, ou inline a comparação — a lista de itens deixa de ser necessária no dashboard).
- `totals`, filtros e coluna Progresso continuam iguais — leem os mesmos campos, agora populados corretamente.

### 3. Validação

Após aplicar, no `/auditoria`:
- Contrato `5b5c0100…b8e7` deve mostrar progresso `12/21` (ok/total) e entrar em "Com pendências" (7 nok).
- Contrato `5f0c5bb9…ee20` → `17/21`, "Com pendências" (2 nok).
- KPIs "Completa", "Com pendências" e "Com alerta" passam a mostrar valores >0 refletindo os 743 contratos.

`ResultadoAuditoria.tsx` (tela de 1 contrato) não é afetado — ele já lê poucos itens e continua usando `calcularRiscoAlto` com a lista real.
