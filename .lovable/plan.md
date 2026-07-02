## Objetivo

Depois que a IA extrair os dados do PDF (Seção B), comparar automaticamente com a Seção A (Imoview) e preencher os itens correspondentes do checklist do Bloco 1 — com marcação de "Verificado pela IA".

## Regras de comparação

Pares Seção A × Seção B mapeados por número do item do checklist do Bloco 1 ("Dados das partes" / "Status do imóvel e contrato"):

| Item # | Rótulo | Campo A (`audit_contracts`) | Campo B (`extracted`) |
|---|---|---|---|
| 4 | Nome do locatário | `locatario_nome` | `locatarios` (split por `;`) |
| 5 | Nome do locador | `locador_nome` | `locadores` |
| 6 | Endereço do imóvel | `endereco_imovel` | `endereco_imovel` |
| — | Índice de reajuste | `indice_reajuste` | `indice_reajuste` |
| — | Garantidora | `garantidora` | `garantidora_normalizada` |

Índice e garantidora ainda não têm item dedicado no seed — adicionamos dois itens novos no Bloco "Consistência no Imoview" (números 25 e 26) via migração + backfill para contratos já existentes.

### Normalização para comparação
Função utilitária `normalize(s)`: lowercase, `NFD` sem acentos, colapsar espaços, trim. Para campos multi-valor (`locatarios`, `locadores`), split por `;` e comparar como conjunto (todos os nomes da Seção A devem aparecer na Seção B, ignorando ordem).

### Resultado por item
- Iguais após normalização → `status = 'ok'`.
- Diferentes → `status = 'nok'` + `observation` = `"IA: Imoview = '<A>' · Contrato = '<B>'"`.
- Um dos lados vazio → mantém `pending` (sem badge).

### Exceção KMR × Quintocred
Se `garantidora = 'KMR'` (A) e `garantidora_normalizada = 'Quintocred'` (B): **não** marcar NOK. Item de garantidora vira `ok` com observação `"Contrato tombado Quintocred"`. Adicionalmente, ao lado do nome da garantidora na Seção A da UI, renderizar um badge neutro cinza "Contrato tombado Quintocred".

### Valor do aluguel
**Não** comparar nem tocar em item de checklist. Na Seção B, abaixo do campo `valor_aluguel` extraído, exibir linha informativa:
`Valor no contrato: R$ X,XX · Valor atual no Imoview: R$ Y,YY — confira no portal da garantidora.`

## Marca "Verificado pela IA"

Adicionar coluna `verified_by_ai boolean not null default false` em `audit_checklist_items` (migração). Comparações automáticas gravam `verified_by_ai = true`. Se o analista mudar o status manualmente depois, o `updateChecklist` existente passa a enviar `verified_by_ai: false` no patch.

No `ChecklistItem.tsx`, quando `verified_by_ai` for `true`, exibir um `Badge` roxo pequeno "Verificado pela IA" ao lado dos botões de status.

## Fluxo de execução

1. Ao final de `runExtract` (o handler que chama `extract-contract` e recebe o `extracted`), disparar `applyAutoComparison(contract, extracted, checklist)`.
2. `applyAutoComparison`:
   - Monta patches por `item_number` conforme a tabela acima.
   - Faz um único `upsert`/`update` em lote por item alterado em `audit_checklist_items` (status, observation, verified_by_ai, updated_by).
   - Atualiza estado local `setChecklist(...)` para refletir sem reload.
   - Dispara um toast: "Checklist atualizado pela IA (N itens verificados)".
3. Trigger `recalc_audit_status` já existente recalcula o `audit_status` automaticamente.
4. Como cada item é salvo individualmente, não é preciso o analista clicar em salvar.

## Migração

```sql
ALTER TABLE public.audit_checklist_items
  ADD COLUMN verified_by_ai boolean NOT NULL DEFAULT false;

-- Novos itens de checklist para contratos existentes
INSERT INTO public.audit_checklist_items (contract_id, item_number, section, item_label)
SELECT id, 25, 'Consistência no Imoview', 'Índice de reajuste: contrato × Imoview'
FROM public.audit_contracts
ON CONFLICT (contract_id, item_number) DO NOTHING;

INSERT INTO public.audit_checklist_items (contract_id, item_number, section, item_label)
SELECT id, 26, 'Consistência no Imoview', 'Garantidora: contrato × Imoview'
FROM public.audit_contracts
ON CONFLICT (contract_id, item_number) DO NOTHING;
```

Atualizar `seed_audit_checklist()` para incluir os itens 25 e 26 no array `items` para contratos futuros.

## Arquivos tocados

- Migração (schema + backfill + update da função `seed_audit_checklist`).
- `src/pages/auditoria/AuditoriaContrato.tsx`:
  - Novo helper `applyAutoComparison` chamado após `runExtract`.
  - `updateChecklist` passa `verified_by_ai: false` quando o usuário altera manualmente.
  - Badge cinza "Contrato tombado Quintocred" ao lado do campo Garantidora na Seção A.
  - Linha informativa de valor de aluguel na Seção B.
- `src/pages/auditoria/components/ChecklistItem.tsx`:
  - Aceitar `verified_by_ai` no tipo `ChecklistRow`.
  - Renderizar badge roxo quando `true`.

Sem mudanças em `extract-contract` (a comparação roda no cliente com dados já retornados).

## Verificação

- Reprocessar um contrato com dados iguais → itens 4/5/6/25/26 ficam ✅ com badge roxo.
- Reprocessar com nome divergente → item vira ❌ com observação IA mostrando os dois valores.
- Contrato KMR cujo PDF é Quintocred → item 26 fica ✅ com observação de tombamento e badge cinza aparece na Seção A.
- Alterar manualmente um item marcado pela IA → badge roxo some.
- Item de aluguel (`item 22` — valor no Imoview) permanece pendente e a linha informativa aparece na Seção B.
