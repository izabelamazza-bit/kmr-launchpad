# Cobmais × Loft: filtros clicáveis e "Valor já programado" só com data confirmada

## 1. Filtro de atraso — diagnóstico

Verifiquei os dados e o código antes de propor mudança:

- Na base há 226 casos com atraso > 0 e 177 com atraso > 30 — exatamente os números do cabeçalho.
- A tabela já recebe a lista filtrada (mesma fonte usada na contagem); não há duas fontes de dado.
- Os 15 casos de maior "Valor em risco" (a ordenação padrão) têm atraso de 65 a 1608 dias. Ou seja: ao aplicar "Atraso > 30 dias", as 49 linhas removidas estão todas no fim da lista, então as linhas visíveis no topo continuam as mesmas — o filtro funciona, mas isso é invisível na tela.

Portanto não há bug de renderização a corrigir. O que falta é feedback visível do filtro ativo. Será adicionado:

- Chips de filtro ativo perto da busca (faixa de atraso e filtro extra), com "✕" para remover cada um.
- No cabeçalho da tabela, além de "X de Y", indicar o que foi aplicado: sem filtro extra, "177 de 226 — 49 fora da faixa"; com filtro extra, "11 de 226 — filtrado por: sem registro no Portal Loft".

Nenhuma tela, rota, coluna ou componente é removido.

## 2. Cards de resumo clicáveis

Os 4 cards do topo passam a ser botões:

- "Sem registro no Portal Loft" → aplica filtro extra `sem registro` (apenas linhas com "Encontrado no Portal Loft" = Não), combinado com o filtro de atraso (E).
- "CPF encontrado no Portal Loft" → filtro extra inverso (apenas encontrados).
- "Casos Loft em atraso" e "Valor total em risco" → apenas limpam o filtro extra (voltam à visão completa da faixa). Esses dois recebem tratamento visual distinto (ícone/rótulo de "limpar filtro" no hover e cursor diferente), para não parecerem filtros como os outros dois.

O card de filtro ativo ganha destaque visual (borda/anel). O chip "Filtro: sem registro no Portal Loft ✕" permite remover só o filtro extra, preservando a faixa de atraso escolhida no dropdown. Os 4 cards continuam calculados sobre a faixa de atraso inteira, nunca sobre o subconjunto do filtro extra — comportamento intencional, para seguirem servindo de referência geral.

## 3. "Valor já programado" — só com data de previsão confirmada

Hoje a coluna soma `valor_atual` de todas as pendências sem `data_pagamento`, mesmo sem data de previsão — o que contradiz o "Sem previsão informada" exibido na coluna ao lado. Confirmei na base que existem contratos nessa situação (ex: 9 pendências em aberto somando R$ 6.135,72 e nenhuma com `dt_vencimento`).

Correção: passa a somar `valor_atual` apenas das pendências com `data_pagamento` nula **e** `dt_vencimento` preenchido. Sem nenhuma pendência nessa condição, a célula mostra "—" com tooltip explicando que há valor em aberto sem data confirmada pela Loft.

O valor em aberto total continua existindo: nos cards do topo, na coluna "Valor em risco" e no tooltip da própria célula e na aba "Pendências" do drawer. Nada é removido.

## Detalhes técnicos

- `src/pages/portal-loft/lib/useInadimplenciaLoft.ts`: adicionar `valorProgramado` e `qtdProgramada` ao `PendenciaResumoContrato` em `buildPendenciaIndex` (condição `!data_pagamento && dt_vencimento`), mantendo `valorEmAberto`/`qtdEmAberto` intactos.
- `src/pages/portal-loft/components/ValorProgramadoCell.tsx`: usar os novos campos; "—" quando `qtdProgramada === 0`, com tooltip citando o valor em aberto sem data.
- `src/pages/portal-loft/lib/useCobmaisLoft.ts`: `useCobmaisLoftFiltrado` recebe um filtro extra opcional (`"todos" | "sem-registro" | "encontrados"`) aplicado após a faixa; `emAtraso` (base dos cards) permanece sem esse filtro.
- `src/pages/portal-loft/components/CobmaisLoftPanel.tsx`: estado do filtro extra, cards clicáveis com estado ativo, chips de filtro ativo e contagem enriquecida no cabeçalho.
- `src/pages/portal-loft/components/CobmaisLoftTable.tsx`: sem mudança de estrutura (recebe as linhas já filtradas).

## Verificação

Ao final, capturo via navegador headless: (1) tabela com "Atraso > 30 dias" mostrando 177 de 226 e o chip ativo; (2) clique em "Sem registro no Portal Loft" isolando só esses casos com a faixa mantida; (3) uma linha com "Sem previsão informada" exibindo "—" em "Valor já programado".
