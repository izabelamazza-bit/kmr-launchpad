## Ajuste 1 — Valor em atraso

Em `useCarteiraIdeali.ts`, o cálculo passa a somar apenas `valor_boleto` das faturas com `status_fatura = 'PE'` e `dado_incompleto = false` (sem subtrair `valor_pago_fatura`). Mesma correção no valor por contrato (`valorEmAtraso` de cada contrato), mantendo "Contratos afetados" e o card de faturas incompletas como estão.

## Ajuste 2 — Gráfico "Contratos por tipo de garantia"

`GarantiaChart.tsx` passa a ter barra única por garantidora com o total de contratos (todos os status), ordenado do maior para o menor. Clique na barra continua filtrando a Seção 5 por garantidora; botão "Limpar filtro" mantido.

## Ajuste 3 — Nova seção "Inadimplência por tipo de garantia"

Novo componente `InadimplenciaChart.tsx`, posicionado entre "Prazo de 60 dias" e "Contratos por tipo de garantia".

- Contrato inadimplente = tem ao menos uma fatura `PE` (inclui `dado_incompleto = true`) — já disponível via `oldestOpen` no agregado.
- Considera apenas contratos com status Ativo, Pausado ou Encerrado.
- Barras agrupadas (3 séries) por garantidora, ordenadas pelo total de inadimplentes.
- Legenda com cores distintas: Ativo (azul #2F80ED), Pausado (laranja #F2994A), Encerrado (vermelho #EB5757).
- Texto acima do gráfico: "Contratos com pelo menos uma fatura em aberto, por garantidora e situação do contrato."
- Clique na barra define filtro combinado (garantidora + status + somente inadimplentes) e mostra "Limpar filtro".

## Integração do filtro

`CarteiraIdeali.tsx` passa a manter um estado de filtro de inadimplência `{ garantidora, status } | null`. `ContratosTable.tsx` recebe essa prop opcional: quando ativa, filtra por garantidora, status e presença de fatura em aberto, e exibe um aviso/botão de limpar. Selecionar o filtro de inadimplência limpa o filtro simples de garantidora e vice-versa, para evitar estados conflitantes.

Nenhuma outra seção é alterada.