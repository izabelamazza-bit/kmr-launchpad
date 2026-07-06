## Objetivo

Adicionar botão **"Exportar relatório"** na tela `/auditoria` que gera `.xlsx` com a lista **filtrada** atualmente visível, contendo as 17 colunas solicitadas.

## Onde adicionar

Ao lado do botão "Importar planilha Imoview" no header de `Auditoria.tsx`, `variant="outline"`, ícone `Download`.

## Colunas do .xlsx

| # | Coluna | Fonte |
|---|---|---|
| 1 | Código do contrato (Imoview) | `imoview_number` |
| 2 | Empresa | `empresa` |
| 3 | Garantidora | `garantidora` |
| 4 | Locatário | `locatario_nome` (fallback extracted) |
| 5 | Endereço do imóvel | `endereco_imovel` (fallback extracted) |
| 6 | Analista responsável | `analyst_name` |
| 7 | Status da auditoria | `audit_status` traduzido (Não iniciada / Em andamento / Completa) |
| 8 | Itens preenchidos | `X/Y` (ok+nok / total) da view `audit_contract_progress` |
| 9 | % de conformidade | `ok_items / total_items` formatado `0.0%`, "-" se total=0 |
| 10 | Nível de risco | alto se `risco_alto`; médio se `nok_items>0`; baixo caso contrário |
| 11 | Qtd itens NOK | `nok_items` |
| 12 | Itens NOK (lista) | `item_label` dos itens `status='nok'`, separados por "; " |
| 13 | Itens verificados por IA | count de `verified_by_ai=true` |
| 14 | Data de início da auditoria | `min(updated_at)` dos itens com status ok/nok |
| 15 | Data da última atualização | `audit_contracts.updated_at` |
| 16 | Data de conclusão | `max(updated_at)` dos itens se `audit_status='Completa'`; vazio caso contrário |
| 17 | Observações do analista | `general_notes` |

## Fluxo

1. Handler `exportToExcel()` pega `contract_id`s de `filtered`.
2. Query única em `audit_checklist_items` (`in(contract_id, ids)`), paginada em lotes de 1000 ids se necessário.
3. Em memória, agrupa por contrato para derivar colunas 12, 13, 14 e 16.
4. Junta com `rows` (que já têm progresso/risco/empresa) e monta a matriz.
5. Gera o `.xlsx` no cliente e dispara download.

## Biblioteca

Adicionar **`xlsx`** (SheetJS) via `bun add xlsx`. Geração no browser, sem edge function.

Formatação: header em negrito, freeze da primeira linha, larguras automáticas (min 12, max 60), datas `dd/MM/yyyy HH:mm`. Nome do arquivo: `auditoria-contratos-YYYY-MM-DD.xlsx`.

## Arquivos

- `src/pages/auditoria/Auditoria.tsx` — botão + handler
- `src/pages/auditoria/lib/exportReport.ts` (novo) — função pura que recebe `rows` + itens e devolve o Blob
- `package.json` — dependência `xlsx`

## Validação

Exportar sem filtro (743 linhas) e conferir contrato 2674: "19/20", itens NOK listados, data de conclusão vazia. Depois testar com filtro (ex: Garantidora=Loft) e conferir que o arquivo contém apenas o subconjunto.
