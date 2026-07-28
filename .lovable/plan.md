## Objetivo
Separar "Sem seguro" em rótulos corretos (Fiador, Caução, Carta Fiança, Sem garantia) em todas as visualizações de garantidora da página /carteira-ideali.

Dados confirmados no banco: 52 Fiador, 12 Caução e 1 Carta Fiança estão hoje com garantidora = "Sem seguro", além de 3 contratos "Sem garantia" e 1 "Seguro Fiança" também marcado como "Sem seguro".

## Implementação

1. `src/pages/carteira-ideali/lib/useCarteiraIdeali.ts`
   - Nova função exportada `getGarantidoraExibicao(c)`:
     - `tipo_garantia` ∈ {Fiador, Caução, Carta Fiança} → retorna o próprio `tipo_garantia`
     - `tipo_garantia` = "Sem garantia" → "Sem garantia"
     - demais casos → `garantidora` (ou "Não informada" se nulo)
   - Comparação de `tipo_garantia` com trim e sem sensibilidade a acento/caixa, para tolerar variações da planilha.

2. `GarantiaChart.tsx` (pizza) — agrupar por `getGarantidoraExibicao` em vez de `garantidora`; mantém filtro status = Ativo.

3. `InadimplenciaChart.tsx` — agrupar por `getGarantidoraExibicao`; mantém regra de inadimplência e quebra Ativo/Pausado/Encerrado.

4. `ContratosTable.tsx` — lista do filtro "Garantidora", a comparação do filtro (incluindo o filtro vindo dos gráficos) e a coluna exibida passam a usar `getGarantidoraExibicao`.

## Fora de escopo
`PrazoSinistroTable.tsx` permanece usando o campo `garantidora` original (CredPago, Credaluga, Eu Acerto). Nenhuma outra lógica da página é alterada e não há mudança no banco de dados.
