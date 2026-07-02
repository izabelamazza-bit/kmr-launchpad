## Objetivo

Corrigir falsos negativos no item 6 (endereço do imóvel) do checklist de auditoria, tornando a comparação insensível a variações de formatação. Reprocessar contratos existentes marcados como NOK nesse item.

## Mudança na lógica de comparação

Em `src/pages/auditoria/lib/autoCompare.ts`, introduzir um normalizador específico para endereços, aplicado antes de comparar o item 6:

Sequência de limpeza (nesta ordem):
1. `toLowerCase()`
2. Remover acentos (`NFD` + strip diacríticos)
3. Colapsar múltiplos espaços em um único
4. Remover espaços ao redor de `,`, `-`
5. Remover pontos finais (`.`)
6. `trim()`

Nova função `normAddress(s)` usada exclusivamente na comparação do item 6 (`endereco_imovel`). Demais itens continuam usando `norm` atual. Se após a normalização os textos forem iguais → `ok`; caso contrário → `nok` com a observação atual mostrando os textos originais (não normalizados) para o analista ver o que a IA extraiu.

## Reprocessamento dos contratos existentes

Ao abrir qualquer contrato em `AuditoriaContrato.tsx`, se existir extração salva em `audit_contract_extracted_data`, já rodamos `applyAutoComparison`. Basta garantir que ele reavalie o item 6 mesmo quando o item atual está `nok` com `verified_by_ai=true` (fluxo já suportado — a comparação sobrescreve o estado).

Para os contratos que o usuário não vai reabrir manualmente, disparar um reprocessamento único em background:

- Novo helper `reprocessAddressNok()` executado uma vez no `useEffect` inicial da tela `Auditoria.tsx` (lista), protegido por uma flag em `localStorage` (`kmr:address-nok-reprocess:v1`) para não repetir.
- Query: buscar todos os `audit_checklist_items` com `item_number = 6` e `status = 'nok'`, junto com o `endereco_imovel` do contrato e o `endereco_imovel` extraído. Para cada linha, aplicar `normAddress` nos dois lados; se ficarem iguais, atualizar o item para `status = 'ok'`, `observation = null`, `verified_by_ai = true`.
- Executado em lote com `Promise.all` e feedback silencioso (sem toast, apenas log). Sem UI extra.

## Arquivos tocados

- `src/pages/auditoria/lib/autoCompare.ts` — adicionar `normAddress` e usá-lo apenas no push do item 6.
- `src/pages/auditoria/lib/reprocessAddress.ts` (novo) — função `reprocessAddressNok()` idempotente.
- `src/pages/auditoria/Auditoria.tsx` — chamada única guardada por flag no `localStorage`.

Sem migração de banco.

## Verificação

- Contrato com endereço "Rua A, 123 - Apto 45" no Imoview e "rua a,123-apto 45." no contrato → item 6 fica `ok` na próxima abertura.
- Contrato com endereço realmente diferente (nº diferente, rua diferente) → continua `nok` com observação mostrando ambos os valores.
- Ao carregar a listagem `/auditoria` pela primeira vez após o deploy, itens 6 marcados como NOK que na verdade batem após normalização são convertidos para OK automaticamente; execuções seguintes não repetem o trabalho (flag em localStorage).
