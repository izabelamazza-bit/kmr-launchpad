## Diagnóstico

Contrato **2674** (`5b5c0100-…-b8e7`) na view:

| total_items | ok_items | nok_items | preenchidos | status |
|---|---|---|---|---|
| **21** | 12 | 7 | 19 | Em andamento |

A view está correta — o problema são **dados legados** em `audit_checklist_items`.

Inspecionando os 21 itens do contrato 2674, existem 2 linhas obsoletas:

| item_number | section | label | status |
|---|---|---|---|
| 23 | **Específico — Loft** | "Verificar forma de pagamento (boleto/cartão/PVI)" | pending |
| 24 | **Específico — Loft** | "Verificar data de renovação" | pending |

Essas linhas foram criadas por uma versão antiga da função `seed_audit_checklist`. A versão atual do seed define:
- item 23 = **"Locatário cadastrado na garantidora com os mesmos dados do contrato"** (section "Cobertura e contrato da garantidora")
- items 27/28 = "Específico garantidora" (que já existem no contrato 2674 e estão preenchidos)

Como o seed usa `ON CONFLICT (contract_id, item_number) DO NOTHING`, os itens 23/24 "Loft" antigos bloquearam a inserção do novo item 23. Resultado: o contrato tem 21 itens (19 respondidos + 2 stale sempre pending), impossível chegar a "Completa".

Contagens no banco:
- **457 contratos** têm essas 2 linhas stale de "Específico — Loft" (914 rows no total; só 2 delas chegaram a ser respondidas).
- **286 contratos** já estão limpos (20 itens conforme o seed atual).

## Correção

Migração única com 2 passos:

### 1. Remover linhas stale
```sql
delete from public.audit_checklist_items
where section = 'Específico — Loft';
```
Impacto: 914 linhas removidas; apenas 2 respostas do usuário são perdidas (aceitável — são de uma versão antiga do checklist que não existe mais na UI). O trigger `trg_recalc_audit_status` recalcula `audit_status` de cada contrato afetado automaticamente.

### 2. Reinserir o item 23 canônico nos contratos afetados
```sql
insert into public.audit_checklist_items (contract_id, item_number, section, item_label)
select c.id, 23, 'Cobertura e contrato da garantidora',
       'Locatário cadastrado na garantidora com os mesmos dados do contrato (nome e CPF)'
from public.audit_contracts c
on conflict (contract_id, item_number) do nothing;
```
Todos os 743 contratos passam a ter exatamente 20 itens conforme o seed atual.

### 3. Validação

Após a migração, para o contrato 2674:
- `total_items` = 20
- `ok_items` + `nok_items` = 19 (12 ok + 7 nok) — o novo item 23 entra como `pending`
- `audit_status` = **"Em andamento"**, progresso **19/20**

Isso significa que 2674 ainda **não** está de fato completo — falta o item 23 novo ("Locatário cadastrado na garantidora com os mesmos dados do contrato"). Após a limpeza, esse item aparece na tela do contrato e o analista pode marcá-lo ok/nok; aí sim o contrato conta como "Completa" no dashboard.

Vou mostrar o resultado final da view para 2674 e a contagem total de "Completa" no dashboard após aplicar.

## Nota

Não altero a estrutura de `audit_checklist_items` nem a lógica da view — a view está agregando corretamente, só estava lendo dados obsoletos.
