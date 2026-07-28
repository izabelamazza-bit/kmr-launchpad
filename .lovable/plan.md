## Verificação no banco (confirmada por SQL agregado, sem limite de linhas)

- `ideali_invoices`: **1116 linhas** (tabela inteira).
- `ideali_contracts`: **181 contratos**.
- Contratos distintos com ao menos 1 fatura `status_fatura = 'PE'`: **51**.
- Com o filtro adicional `dado_incompleto = false`: **26**.
- Só com faturas pendentes sem valor registrado: 45 contratos.

Conclusão: o valor de referência 51 corresponde ao critério "ao menos 1 fatura pendente", sem o filtro `dado_incompleto`. Critério aprovado para o card: **51 de 181**.

## Correções

1. **Card "Contratos afetados"** (`src/pages/carteira-ideali/lib/useCarteiraIdeali.ts`): contar contratos distintos com ao menos 1 fatura `status_fatura = 'PE'`, sem filtro de `dado_incompleto` e sem filtro de status do contrato. Denominador continua sendo o total geral de contratos (181). Resultado esperado: 51 de 181.
2. **Paginação determinística das faturas**: a carga client-side pagina de 1000 em 1000 sem ordenação explícita, e a tabela tem 1116 linhas — sem `order by` o banco não garante ordem estável entre páginas, podendo duplicar ou perder registros. Adicionar ordenação estável (por `codigo_contrato` e `id_fatura_origem`) na busca de `ideali_invoices`.
3. **Card "Valor em atraso"**: mantém o critério atual (soma de `valor_boleto` de faturas `PE` com valor confirmado), pois somar faturas sem valor não faz sentido monetário. O texto de apoio já diz "com valor confirmado".
4. **Validação após a correção**: conferir na tela que o card mostra 51 de 181, coerente com a query de referência.

## Seções 5 e 6 (inadimplência e tabela de contratos)

Revisado: o gráfico agrupa por `Ativo`, `Pausado` e `Encerrado` e o clique aplica exatamente o status clicado; a tabela também. Não há filtro fixo em `Ativo` nessas seções. Elas já usam o critério "ao menos 1 fatura `PE`", que passa a ficar alinhado com o card. Após corrigir a paginação, vou conferir que cada clique traz os contratos do status correspondente.

O gráfico de pizza da seção 4 continua filtrando apenas contratos `Ativo`, sem alteração.

## Detalhes técnicos

Arquivo alterado: `src/pages/carteira-ideali/lib/useCarteiraIdeali.ts` (agregação de `contratosAfetados` e ordenação na paginação de `ideali_invoices`). Sem mudanças de banco de dados e sem alterações em `GarantiaChart.tsx`.
