## Objetivo
Adicionar um asterisco (*) ao número "26" nos cards "Contratos afetados" e "% de Inadimplência" da seção 2. Financeiro em `/carteira-ideali`, e incluir uma nota explicativa abaixo da fileira de cards sobre os 51 contratos com faturas em aberto e dados incompletos.

## Contexto atual
A seção Financeiro exibe:
- **Valor em atraso**: soma de faturas `PE` com valor confirmado.
- **Contratos afetados**: contratos distintos com ao menos 1 fatura `PE` e `dado_incompleto = false`.
- **% de Inadimplência**: mesmo numerador/denominador do card anterior.
- **Faturas com dado incompleto**: total de faturas com `dado_incompleto = true`.
- **Carteira ativa/mês**: soma dos aluguéis dos contratos ativos.

O cálculo dos "Contratos afetados" ignora faturas `PE` com informação incompleta (sem valor de boleto ou valor pago confirmado). A nota deve deixar isso transparente sem alterar a métrica principal.

## Implementação

### 1. Cálculo do novo indicador
No hook `src/pages/carteira-ideali/lib/useCarteiraIdeali.ts`:
- Calcular `contratosAfetadosIncompletos`: quantidade de contratos distintos que possuem ao menos 1 fatura `PE` com `dado_incompleto = true`.
- Adicionar o campo à interface `CarteiraData`.
- O valor esperado é **51**, conforme validado na base.

### 2. Passar o dado para o componente
Em `src/pages/carteira-ideali/CarteiraIdeali.tsx`:
- Incluir `contratosAfetadosIncompletos={data.contratosAfetadosIncompletos}` na chamada de `<FinanceiroCards />`.

### 3. Alterar o componente FinanceiroCards
Em `src/pages/carteira-ideali/components/FinanceiroCards.tsx`:
- Receber nova prop `contratosAfetadosIncompletos: number`.
- No card **Contratos afetados**, renderizar o número com asterisco: `26*`.
- No card **% de Inadimplência**, alterar o texto de apoio para: `26* de 181 contratos com fatura em aberto (dado completo)`.
- Abaixo da fileira de cards (`grid`), adicionar parágrafo com o texto:
  > * 51 contratos têm ao menos 1 fatura em aberto, mas com informações incompletas (sem valor de boleto ou valor pago confirmado). Esses casos não entram no cálculo acima por não termos valor confiável para somar, mas ainda são risco real de inadimplência — considere-os também.
- Estilo da nota: texto pequeno (`text-xs`), cor neutra (`text-muted-foreground`), sem ícone.

## Critérios de aceitação
- [ ] Os cards "Contratos afetados" e "% de Inadimplência" exibem `26*`.
- [ ] A nota aparece abaixo da fileira de cards Financeiro, com o texto exato solicitado.
- [ ] O valor de 51 é calculado a partir dos dados reais (não hardcoded).
- [ ] A métrica de inadimplência principal não é alterada (mantém 26/181).
- [ ] O gráfico da seção 5 permanece inalterado, conforme instrução anterior.