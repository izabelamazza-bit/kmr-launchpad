# Texto explícito quando há valor programado em pendências anteriores

## Problema

Na coluna "Status de sinistro na Loft", a segunda linha olha apenas a pendência **mais recente** do contrato: sem `dt_vencimento`, exibe "Sem previsão informada". Já a coluna "Valor já programado" soma **todas** as pendências em aberto com previsão confirmada. Quando a pendência mais recente não tem previsão mas outras do mesmo contrato têm, a linha parece se contradizer: "Sem previsão informada" ao lado de um valor programado.

## Ajuste

Um único caso muda de texto — pendência mais recente sem `dt_vencimento` e sem `data_pagamento`, mas o contrato tem pelo menos uma pendência programada (`qtdProgramada > 0`):

- Antes: `Sem previsão informada`
- Depois: `Pendência mais recente sem previsão — R$ X programado em N pendência(s) anterior(es)`

Com tooltip explicando: a previsão exibida refere-se sempre à pendência mais recente; o valor programado soma as pendências em aberto do contrato que já têm data confirmada pela Loft.

Quando o contrato não tem nenhuma pendência programada (`qtdProgramada === 0`), o texto continua "Sem previsão informada" — nesse caso "Valor já programado" mostra "—" e não há contradição.

Nada mais muda: badges de status, alerta de "sem retorno da Loft", filtros, cards e o cálculo de "Valor já programado" ficam idênticos.

## Detalhes técnicos

- `src/pages/portal-loft/components/SinistroLoftBadge.tsx`: no bloco final (linhas 71-79), adicionar o ramo intermediário entre "Previsto para" e "Sem previsão informada", usando `pendencia.valorProgramado` / `pendencia.qtdProgramada` (já disponíveis no resumo) e `fmtMoney` de `../lib/usePortalLoft`. Texto em duas partes para caber na célula (linha extra em `text-xs`).
- Nenhuma alteração em hooks, dados ou lógica de filtro.

## Verificação

Depois do ajuste, localizo via navegador headless uma linha real nessa condição na tela Cobmais × Loft (começando pelos contratos já citados, 4943/4967/7614; se nenhum servir, uso outro contrato com `qtdProgramada > 0` e pendência recente sem previsão) e envio o print da célula mostrando o texto novo lado a lado com o valor da coluna "Valor já programado".
