## Objetivo

Criar a página `/carteira-ideali` contendo apenas o fluxo de importação da planilha da carteira Ideali (sem dashboard, cards ou gráficos), seguindo o mesmo padrão do import Imoview (biblioteca `xlsx` + modal com etapa de resumo).

## Arquivos

1. `src/pages/carteira-ideali/lib/idealiImport.ts` — parser da planilha
2. `src/pages/carteira-ideali/components/ImportIdealiModal.tsx` — modal de upload, resumo e gravação
3. `src/pages/carteira-ideali/CarteiraIdeali.tsx` — página com título e botão "Importar carteira Ideali"
4. `src/App.tsx` — rota temporária `/carteira-ideali` (sem link no menu)

## Parser (`idealiImport.ts`)

- Lê o arquivo com `XLSX.read` (mesmo padrão do `imoviewImport.ts`).
- Valida que existem as abas exatas **"Contratos"** e **"Histórico faturas"**; se faltar alguma, lança erro claro listando as abas encontradas.
- Normalização de valores: `"\N"`, string vazia e `undefined` viram `null` (nunca 0 nem `""`). Helpers reaproveitando a lógica do Imoview: `parseDate` (serial Excel, dd/mm/aaaa, ISO), `parseNumber` (aceita vírgula decimal e "R$"), `parseBool` (Sim/Não, 1/0, true/false).

### Aba "Contratos"
- Mapeamento exato de colunas conforme especificado no pedido (43 colunas → campos de `ideali_contracts`).
- Deduplicação: agrupar por `codigo_contrato`; usar a linha com `inquilino_principal = "Sim"`; se não houver, a primeira do grupo. Contabilizar quantos códigos tinham mais de uma linha.
- Linhas sem `codigo_contrato` são ignoradas e contadas à parte.

### Aba "Histórico faturas"
- Mapeamento das 10 colunas indicadas; colunas de rubrica (`name_release`, `valor_lan`, `credito_lan`, `debito_lan`, `id_lan`) são ignoradas.
- Deduplicação: agrupar por `id_fatura` e manter a primeira linha do grupo.
- `dado_incompleto = true` quando `status_fatura = "PE"` e (`valor_boleto` nulo ou `valor_pago_fatura` nulo); caso contrário `false`.
- Faturas cujo `codigo_contrato` não exista entre os contratos da planilha nem no banco seriam rejeitadas pela chave estrangeira — elas são separadas e reportadas no resumo em vez de quebrar a importação.

## Modal (`ImportIdealiModal.tsx`)

Três etapas dentro do mesmo diálogo:

1. **Upload** — input `.xlsx` + botão "Analisar planilha" (parse local, sem gravar nada).
2. **Resumo/confirmação** — mostra: contratos únicos, quantos foram deduplicados por fiador/cotitular, faturas únicas, faturas com `dado_incompleto`, linhas ignoradas. Botões "Cancelar" e "Confirmar importação".
3. **Resultado** — totais efetivamente gravados e eventuais erros.

## Gravação

- `ideali_contracts`: `upsert` com `onConflict: "codigo_contrato"`, sempre com `empresa = 'Ideali'`.
- `ideali_invoices`: `upsert` com `onConflict: "id_fatura_origem"`.
- Contratos primeiro, faturas depois (restrição de chave estrangeira já confirmada no banco).
- Envio em lotes (ex.: 500 registros por chamada) com barra/contador de progresso, para planilhas grandes.
- Erros por lote são coletados e exibidos na tela de resultado, sem abortar o restante.

## Fora do escopo

Nenhum dashboard, KPI, card, gráfico, listagem ou item de menu nesta entrega.
