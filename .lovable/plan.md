# Cálculo automático de multa e juros no débito de aluguel

## O que muda
Na seção "Débito de aluguel" da tela de sinistro, ao informar o **Valor original** e a **Data de vencimento**, o sistema calcula sozinho:

- **Multa**: 10% fixo sobre o valor original
- **Juros**: 1% ao mês pro-rata dia (1% ÷ 30 por dia de atraso) sobre o valor original
- **Valor total atualizado**: original + multa + juros

Se o vencimento for hoje ou no futuro, multa e juros ficam em R$ 0,00 e o total é igual ao valor original.

Os três valores aparecem logo abaixo do "Valor original", como campos somente leitura, atualizando na hora a cada mudança de valor ou data. Junto ao total é exibido o número de dias de atraso considerado.

Os valores calculados são salvos junto com o registro do sinistro e passam a aparecer na tela de visualização do sinistro (colunas de multa, juros e total na tabela de débitos).

Nenhum outro campo ou cálculo da tela é alterado.

## Detalhes técnicos
- Novas constantes no topo de `src/pages/sinistros/NovoSinistro.tsx`: `PERCENTUAL_MULTA = 0.10` e `PERCENTUAL_JUROS_MENSAL = 0.01`, com taxa diária derivada (`/30`).
- Função pura `calcularEncargos(valorOriginal, dataVencimento)` retornando `{ diasAtraso, multa, juros, total }`; dias corridos = diferença entre hoje (meia-noite) e o vencimento, mínimo 0.
- Cálculo derivado via `useMemo` a partir de `aluguelValor` e `aluguelVencimento` (sem novo estado).
- Migração no banco: adicionar em `sinistro_debitos` as colunas `valor_multa numeric`, `valor_juros numeric`, `valor_total numeric` e `dias_atraso integer` (default 0), e gravá-las no insert do débito de aluguel.
- `ResumoSinistro.tsx`: exibir multa, juros e total do débito de aluguel na tabela existente, mantendo a soma atual intacta.
