# Status de sinistro na Loft — célula resumida e clicável

## Verificações feitas antes do plano

- O cruzamento está errado hoje: o código do contrato do Cobmais **nunca** casa com o das pendências da Loft (0 correspondências em 197 linhas). Por isso a coluna vive vazia. O caminho correto é: CPF do Cobmais → contrato no snapshot do Portal Loft → pendências desse contrato (esse caminho funciona: 416 casamentos por CPF, e as pendências casam com os snapshots).
- Não existe tabela de movimentações/notas da Loft neste projeto, e o histórico do chat não tem nenhum registro de a importação do `movimentacoes.csv` ter sido pedida ou executada antes desta conversa — ela nunca foi implementada aqui (não foi revertida). Fica como passo separado, com o desenho já combinado (`guarantor_portal_case_notes` + aba "Movimentações").
- O drawer de histórico tem hoje duas abas: "Histórico" e "Pendências".

## O que muda

1. **Correção do cruzamento**: as pendências passam a ser buscadas pelo contrato do Portal Loft encontrado por CPF (com fallback para o contrato do Cobmais quando não houver contrato no portal).

2. **Célula "Status de sinistro na Loft"** (sem colunas novas), em duas linhas:
   - Linha 1: badge de status (cores atuais) + texto pequeno "última atualização há X dias", calculado a partir da data mais recente da pendência do contrato (criação, vencimento ou pagamento — a maior delas). Sem pendência: badge "Sem pendência importada" e o texto "Sem movimentação registrada".
   - Linha 2 (menor, cor secundária): "Pago em dd/mm/aaaa" quando houver pagamento, senão "Previsto para dd/mm/aaaa".

3. **Indicador de atenção**: quando a última atualização tiver 5 dias ou mais **e** o status mais recente não for "Concluído"/variações, um ponto/ícone laranja aparece ao lado da data, com tooltip "Sem retorno da Loft há X dias — precisa de cobrança".

4. **Célula clicável**: clicar abre o drawer de histórico focado no contrato Loft daquela linha, já na aba "Pendências" se houver pendência, senão na aba "Histórico". (A aba "Movimentações" entra quando a importação real das movimentações da Loft for feita.)

5. **Novo filtro** no dropdown de faixas: "Sem retorno da Loft (5+ dias)", listando apenas os casos com o indicador de atenção ativo.

## Detalhes técnicos

- `lib/useInadimplenciaLoft.ts`: `PendenciaResumoContrato` ganha `ultimaAtualizacao` (maior data entre `criado_em`, `data_pendencia`, `dt_vencimento`, `data_pagamento` das pendências do contrato) e helpers `diasDesde()` / `estaParado()` reutilizáveis.
  - Comentário obrigatório junto a `ultimaAtualizacao`: o cálculo usa **apenas** dados de pendência (`guarantor_portal_inadimplencia`) porque as movimentações reais da Loft (`movimentacoes.csv`) ainda não foram importadas; quando essa importação existir, `ultimaAtualizacao` deve passar a considerar também a nota mais recente (maior data entre pendência e nota) — revisitar quando a aba "Movimentações" existir.
- `lib/useCobmaisLoft.ts`: nova propriedade `contratoLoft` na `CobmaisLoftRow` (do `portal.contrato`, com fallback no contrato Cobmais); `FAIXAS` ganha a opção `sem-retorno`; `useCobmaisLoftFiltrado` passa a receber o índice de pendências para aplicar esse filtro.
- `components/SinistroLoftBadge.tsx`: renderiza as duas linhas, o "há X dias", o indicador de atenção e a lógica de "parado" (status sem `conclu`).
- `components/CobmaisLoftTable.tsx`: a célula recebe `onClick` (com `cursor-pointer` e `role="button"`) chamando um novo callback `onAbrirHistorico(contratoLoft)`; a busca da pendência passa a usar `r.contratoLoft`.
- `components/CobmaisLoftPanel.tsx`: guarda o contrato selecionado em estado e monta o `HistoricoDrawer` já existente com a aba inicial calculada; passa o filtro novo ao hook.
- `components/HistoricoDrawer.tsx`: aceita prop opcional `abaInicial` para abrir direto em "Pendências".
- Sem mudanças de banco.