# Cobmais: aceitar dois formatos de cabeçalho

A importação do relatório Cobmais volta a tolerar o formato antigo, sem perder os campos novos.

## Formatos aceitos

- **Formato A (9 colunas)**: CPF/CNPJ, CLIENTE, CREDOR, CONTRATO, ATRASO, PRODUTO, OBSERVAÇÃO, RISCO, MARCADOR
- **Formato B (12 colunas)**: CPF/CNPJ, CLIENTE, CREDOR, CONTRATO, ATRASO, PRODUTO, OBSERVAÇÃO, ACORDO, RISCO, ULTIMO EVENTO, ULTIMO CONTATO, MARCADOR

## Comportamento na importação

1. O cabeçalho da aba "Cobrança" é comparado contra as duas listas, na ordem exata de cada formato. O primeiro que bater define o formato do arquivo.
2. Se o cabeçalho não bater com nenhum dos dois, o erro atual continua aparecendo, agora listando o que falta e o que sobra **em relação a cada um dos dois formatos**, deixando claro que qualquer um dos dois é aceito.
3. CPF/CNPJ continua obrigatório nos dois formatos. Se ela estiver ausente (como na exportação de 18/08), a importação é bloqueada antes de gravar qualquer coisa, com a mensagem dedicada que já existe explicando que o cruzamento por CPF depende dela.
4. No Formato A, os três campos exclusivos do Formato B (acordo, último evento, último contato) são gravados vazios — nada é inventado nem herdado de importações anteriores.
5. Nada muda nas conversões já existentes (atraso, risco, SIM/NÃO, data/hora brasileira), na normalização do PRODUTO, nas linhas sem CPF ignoradas, nem no cruzamento por CPF na tela Cobmais × Loft.

## Tela Cobmais × Loft

Sem mudanças de layout. O badge "Com acordo" e a linha de último evento/contato simplesmente não aparecem quando o dado veio de um arquivo no Formato A.

## Detalhes técnicos

- `src/pages/cobmais/lib/cobmaisXlsxImport.ts`: substituir `COBMAIS_HEADERS` por `COBMAIS_FORMATS` (`{ nome, headers }` para A e B); nova função `detectFormat(headerRow)` exportada, que valida ordem exata e retorna o formato ou `null`; a checagem de CPF/CNPJ permanece antes de tudo (`MissingCpfColumnError`).
- `HeaderMismatchError` passa a receber os diffs por formato (missing/extra de A e de B) e monta uma mensagem com as duas opções.
- O mapeamento de colunas usa índices resolvidos por nome; para o Formato A, `acordo`, `ultimo_evento` e `ultimo_contato` são fixados em `null`.
- Testes em `cobmaisXlsxImport.test.ts`: casos para `detectFormat` (A, B, cabeçalho inválido) além dos testes já existentes de parsers.
- `ImportCobmaisModal.tsx` só exibe `error.message`, então não precisa de alteração; opcionalmente o resultado da análise pode informar o formato detectado.
- Nenhuma mudança de banco — as colunas já existem e aceitam nulos.
