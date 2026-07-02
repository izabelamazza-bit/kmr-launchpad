## Objetivo

Preencher automaticamente os itens 1, 2 e 3 do checklist ao abrir qualquer contrato de auditoria, usando apenas os dados já importados do Imoview (Seção A) — sem depender de upload de PDF. Renderizar badges informativos dentro de cada item e marcar "Verificado pela IA".

## Regras por item

**Item 1 — Imóvel ocupado ou desocupado** (campo `ocupacao`)
- Sempre `status = 'ok'` quando `ocupacao` existir.
- Badge dentro do item:
  - `Ocupado` → verde (#27AE60)
  - `Desocupado` → cinza (#9CA3AF)

**Item 2 — Contrato saudável ou inadimplente** (campo `status_contrato`)
- Sempre `status = 'ok'` quando `status_contrato` existir.
- Badge dentro do item:
  - `Saudavel` → verde, texto "Saudável"
  - `Inadimplente` → vermelho (#EB5757)

**Item 3 — Prazo do contrato** (campo `data_proximo_reajuste`)
- Calcular `diffDays = data_proximo_reajuste - hoje`.
- Badge + status:
  - `> 90 dias` → verde, "Próximo reajuste em DD/MM/AAAA · X dias" → `ok`
  - `31–90 dias` → amarelo (#F2C94C), "Reajuste se aproximando · DD/MM/AAAA · X dias" → `ok`
  - `1–30 dias` → laranja (#F2994A), "Reajuste iminente · DD/MM/AAAA · X dias" → `nok`
  - `≤ 0 dias` → vermelho (#EB5757), "Reajuste em atraso desde DD/MM/AAAA" → `nok`
- Sem `data_proximo_reajuste` → não tocar no item.

Todos os três recebem `verified_by_ai = true`. Alteração manual continua limpando o selo (fluxo existente no `updateChecklist`).

## Fluxo

1. Ao final do `load()` em `AuditoriaContrato.tsx` (após carregar contrato + checklist), disparar `applyImoviewChecklist(contract, checklist)`.
2. Função retorna patches por `item_number` (1, 2, 3), cada um com `status`, `observation` (string curta usada pelo componente para renderizar o badge) e `verified_by_ai: true`.
3. `UPDATE` em lote em `audit_checklist_items` (apenas itens que mudaram — comparar com estado atual para evitar writes redundantes a cada abertura).
4. `setChecklist(...)` local para refletir imediatamente.
5. Trigger `recalc_audit_status` já cuida do status geral.

Idempotência: só grava se `status/observation/verified_by_ai` diferirem do que já está no banco. Assim reabrir a página não gera writes repetidos.

## Renderização do badge dentro do item

Estender `ChecklistItem.tsx` para reconhecer um `observation` prefixado com um marcador estruturado e renderizar o badge colorido em vez do textarea de observação. Formato proposto:

```
@@badge:<cor>:<texto>
```

- `applyImoviewChecklist` grava, por ex., `@@badge:green:Ocupado` no campo `observation`.
- `ChecklistItem` detecta o prefixo `@@badge:`, extrai cor/texto e renderiza um `<Badge>` inline ao lado do label do item; nesse caso não exibe o textarea de observação nem o botão "+ Adicionar observação".
- Se o analista trocar o status manualmente, `updateChecklist` já envia `verified_by_ai=false` e limpa `observation`, então o badge desaparece.

Paleta dos badges (mapeada em `ChecklistItem`):

| cor    | bg        | fg      |
|--------|-----------|---------|
| green  | #E8F7EE   | #1E7F3E |
| gray   | #EEF1F5   | #4F4F4F |
| red    | #FDECEC   | #B93030 |
| yellow | #FFF6D6   | #8A6D00 |
| orange | #FFE7CF   | #A8500C |

## Arquivos tocados

- **Novo:** `src/pages/auditoria/lib/imoviewChecklist.ts`
  - `buildImoviewPatches(contract, checklist): AutoPatch[]`
  - `applyImoviewChecklist(contract, checklist): Promise<AutoPatch[]>` (com diff/idempotência)
- **`src/pages/auditoria/AuditoriaContrato.tsx`**
  - Import do novo helper.
  - Chamada após `load()` (e após `applyAutoComparison` quando também roda extração, para não haver conflito nos itens 1/2/3 — esses itens não fazem parte do `applyAutoComparison` atual, então não há sobreposição).
- **`src/pages/auditoria/components/ChecklistItem.tsx`**
  - Parser do prefixo `@@badge:` no `observation`.
  - Renderização inline do badge colorido em vez do textarea quando o marcador estiver presente.
  - Mantém badge roxo "Verificado pela IA" já existente.

Sem migração de banco (colunas `status`, `observation`, `verified_by_ai` já existem).

## Verificação

- Abrir contrato ocupado + saudável + reajuste em 120 dias → itens 1, 2 e 3 ficam ✅ com badges verde/verde/verde.
- Contrato desocupado → item 1 ✅ com badge cinza "Desocupado".
- Contrato inadimplente → item 2 ✅ com badge vermelho "Inadimplente".
- Contrato com reajuste em 20 dias → item 3 ❌ com badge laranja "Reajuste iminente".
- Contrato com reajuste vencido → item 3 ❌ com badge vermelho "em atraso desde…".
- Alterar manualmente qualquer um dos três → badge roxo some, badge colorido some, observação limpa.
- Reabrir a mesma página duas vezes seguidas → nenhum `UPDATE` disparado na segunda abertura (idempotência).
