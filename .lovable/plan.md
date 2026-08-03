# Pendências do Portal Loft (inadimplência)

Extensão de dados: nova tabela de pendências financeiras da Loft, importação do `inadimplencia.csv` e uso desse dado nas telas que já existem. Nada é removido.

## 1. Nova tabela

`guarantor_portal_inadimplencia` com os campos pedidos (contrato, pendencia_id, imob_status, status_codigo, contract_status_codigo, valor, valor_atual, data_pendencia, criado_em, data_pagamento, dt_vencimento, forma_pgto_codigo, expiration_days, details_json, data_importacao), `import_id` referenciando `guarantor_portal_imports` com `on delete set null`, índice único em `pendencia_id`, índice em `contrato`, GRANTs, RLS ligado e políticas de leitura/criação/edição/exclusão para qualquer usuário autenticado — mesmo padrão das outras tabelas do projeto.

## 2. Importação do CSV

Novo `src/pages/portal-loft/lib/inadimplenciaCsvImport.ts` (papaparse, no mesmo estilo de `loftCsvImport.ts`):

- Valida o cabeçalho exato das 14 colunas; erro claro listando colunas faltantes/inesperadas.
- Datas: `dataPendencia`/`dtVencimento`/`dataPagamento` como `date`, `criadoEm` como timestamptz; vazio vira nulo.
- `details_json`: vazio ou `[]` grava `[]`; caso contrário faz parse do JSON e, se o texto for inválido, mantém `[]` e conta a linha em "com JSON ignorado" no resumo.
- Linhas sem `contrato` ou sem `id` são ignoradas e contadas.
- Grava em lotes de 500 com upsert por `pendencia_id` (reimportar atualiza, não duplica).
- Para o resumo "novos × atualizados", consulta antes quais `pendencia_id` do arquivo já existem no banco.
- Vincula o `import_id` a um registro em `guarantor_portal_imports` da importação.

Novo `ImportInadimplenciaModal.tsx` (cópia do padrão do `ImportLoftModal`): seleção do arquivo, análise, progresso e resumo final com total processado, novos, atualizados e ignorados. Botão "Importar inadimplência" no cabeçalho da aba Portal Loft, ao lado do "Importar novo CSV".

## 3. Status de sinistro na Loft (aba Cobmais × Loft)

Novo hook `useInadimplenciaLoft.ts` que carrega as pendências e devolve, por contrato: pendência mais recente por `criado_em` e soma de `valor_atual` das pendências sem `data_pagamento`. O cruzamento usa o campo contrato (normalizado, sem espaços/zeros à esquerda).

`SinistroLoftBadge.tsx` passa a mostrar, quando houver pendência para o contrato, um badge com o `imob_status` mais recente:

- verde: "Concluído" e variações
- amarelo: "Devedor", "Pendência Aberta", "Acordo"
- vermelho: "Negado"
- cinza: "Pendência Cancelada", "Alteração Imobiliária" e qualquer texto não reconhecido

Ao lado do badge: "Pago em dd/mm/aaaa" em verde quando houver `data_pagamento`; senão "Previsto para dd/mm/aaaa" quando houver `dt_vencimento`. Sem pendência para o contrato, o componente mantém o texto atual de aguardando integração.

## 4. Coluna "Valor já programado"

`ValorProgramadoCell.tsx` passa a exibir a soma de `valor_atual` das pendências do contrato com `data_pagamento` nula, com tooltip informando quantas pendências entraram na soma. Sem pendências para o contrato, mantém "—" com o tooltip atual.

## 5. Drawer de histórico do contrato

O drawer atual é uma linha do tempo única de snapshots. Ele passa a ter abas: "Histórico" (a linha do tempo de hoje, sem mudanças) e "Pendências", que lista as linhas de `guarantor_portal_inadimplencia` do contrato ordenadas por `data_pendencia` decrescente, com data da pendência, valor atualizado, badge de status e previsão/data de pagamento. Sem pendências, mostra estado vazio explicativo.

## Detalhes técnicos

- Arquivos novos: `lib/inadimplenciaCsvImport.ts`, `lib/useInadimplenciaLoft.ts`, `components/ImportInadimplenciaModal.tsx`, `components/PendenciaStatusBadge.tsx`, `components/PendenciasTab.tsx`.
- Arquivos alterados: `SinistroLoftBadge.tsx`, `ValorProgramadoCell.tsx`, `CobmaisLoftPanel.tsx` (passar o índice de pendências para a tabela), `CobmaisLoftTable.tsx` (repassar props), `HistoricoDrawer.tsx` (abas), `PortalLoft.tsx` (botão + modal).
- O badge e a célula de valor continuam isolados: só o corpo deles muda, a tabela não é redesenhada.
- Nenhuma tabela, rota, view ou componente existente é apagado.

## Validação final

Depois de aplicar, importo o `inadimplencia.csv` que você enviar (ou peço o arquivo) e mostro capturas da aba Cobmais × Loft com um caso exibindo badge de status e valor previsto, e do drawer do contrato 97183 com a aba "Pendências" preenchida.
