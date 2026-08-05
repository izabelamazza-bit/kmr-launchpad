# Multa e juros no débito de aluguel (cálculo dinâmico)

## Confirmação do banco
Os débitos do sinistro já são salvos hoje na tabela existente **`sinistro_debitos`**, com as colunas: `id`, `sinistro_id`, `tipo`, `descricao`, `data_vencimento`, `valor`, `boleto_path`, `created_at`. Nenhuma tabela nova será criada — apenas colunas adicionais nessa mesma tabela.

## O que muda
Na seção "Débito de aluguel" (tela /novo-sinistro), ao informar **Valor original** e **Data de vencimento**, o sistema calcula automaticamente:

- **Multa**: 10% fixo sobre o valor original
- **Juros**: 1% ao mês pro-rata dia (1% ÷ 30 por dia corrido de atraso) sobre o valor original
- **Valor total atualizado**: original + multa + juros

Se o vencimento for hoje ou no futuro, multa e juros ficam em R$ 0,00 e o total é igual ao valor original.

Multa, juros e total aparecem abaixo do "Valor original" como campos somente leitura, atualizando na hora a cada mudança de valor ou data, junto com os dias de atraso considerados.

**Cálculo sempre dinâmico:** na tela de visualização do sinistro já salvo, os dias de atraso, multa, juros e total são **recalculados a cada abertura da tela** comparando a data de vencimento salva com a data de hoje. Nunca é exibido um valor congelado do banco.

**Registro histórico:** no momento do salvamento, multa, juros, total e dias de atraso são gravados no banco como registro do valor na abertura do sinistro — mas a visualização sempre mostra o valor recalculado.

Nenhum outro campo ou cálculo da tela é alterado.

## Detalhes técnicos
- Novo utilitário compartilhado `src/pages/sinistros/lib/encargos.ts` com as constantes `PERCENTUAL_MULTA = 0.10` e `PERCENTUAL_JUROS_MENSAL = 0.01` (taxa diária derivada por `/30`) e a função pura `calcularEncargos(valorOriginal, dataVencimento)` retornando `{ diasAtraso, multa, juros, total }`.
- Dias de atraso = dias corridos entre o vencimento e hoje (ambos normalizados à meia-noite), mínimo 0.
- Arredondamento de `multa`, `juros` e `total` para 2 casas via `Math.round(v * 100) / 100` antes do retorno.
- `NovoSinistro.tsx`: cálculo derivado por `useMemo` a partir de `aluguelValor` e `aluguelVencimento`; exibição somente leitura; gravação dos valores no insert do débito de aluguel.
- Migração: adicionar em `sinistro_debitos` as colunas `valor_multa numeric`, `valor_juros numeric`, `valor_total numeric` e `dias_atraso integer` (nullable, sem alterar colunas existentes).
- `ResumoSinistro.tsx`: importa a mesma `calcularEncargos()` e recalcula em tempo real por débito, exibindo multa, juros, dias de atraso e total atualizado na tabela; o total consolidado passa a usar os valores recalculados.
