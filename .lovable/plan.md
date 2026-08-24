# Cobmais: novo formato de 12 colunas

Atualizar a importação do relatório Cobmais para o formato atual do arquivo e aproveitar os três campos novos na tela Cobmais × Loft.

## Banco de dados

Adicionar em `cobmais_snapshots`:

- `acordo` (verdadeiro/falso) — vem como "SIM"/"NÃO" no arquivo
- `ultimo_evento` (texto)
- `ultimo_contato` (data e hora) — vem como DD/MM/AAAA HH:MM:SS

A consulta consolidada `cobmais_latest_loft` lista as colunas uma a uma, então ela é recriada incluindo os três campos novos (mesma regra de hoje: registro mais recente por CPF/CNPJ com garantidora Loft). Nenhum dado existente é apagado; nas importações antigas os campos novos ficam vazios.

## Importação

- O cabeçalho passa a ser validado contra exatamente estas 12 colunas: CPF/CNPJ, CLIENTE, CREDOR, CONTRATO, ATRASO, PRODUTO, OBSERVAÇÃO, ACORDO, RISCO, ULTIMO EVENTO, ULTIMO CONTATO, MARCADOR. O formato antigo de 9 colunas deixa de ser aceito.
- Coluna faltando ou inesperada continua gerando erro claro antes de gravar qualquer coisa, dizendo o que falta e o que sobra. A ausência de CPF/CNPJ é destacada como bloqueio crítico, com mensagem própria explicando que o cruzamento por CPF depende dela.
- Conversões: "SIM"/"S"/"TRUE"/"1" → verdadeiro; "NÃO"/"N"/"FALSE"/"0" → falso; vazio → não informado. Data/hora brasileira convertida corretamente; valor inválido ou vazio fica vazio em vez de gerar erro.
- Linhas sem CPF/CNPJ continuam sendo ignoradas na contagem, como hoje.

## Tela Cobmais × Loft

Na coluna "Status no Cobmais", junto ao badge atual:

- badge verde-claro "Com acordo" quando houver acordo;
- linha secundária, menor, com último evento e a data do último contato — ex.: "Envio de E-mail — 10/08/2026". Sem dados, a linha simplesmente não aparece.

O cruzamento por CPF permanece igual — nada muda na identificação dos contratos no Portal Loft.

## Verificação final

Depois de implementado, abro a tela e mostro um caso com "Com acordo" e último evento/contato preenchidos. Isso depende de existir uma importação no novo formato: se o banco só tiver dados do formato antigo, esses campos estarão vazios e será necessário importar o arquivo novo (ou eu confirmo com uma linha de teste e removo em seguida) — aviso qual foi o caso.

## Detalhes técnicos

- Migração: `ALTER TABLE public.cobmais_snapshots ADD COLUMN acordo boolean, ADD COLUMN ultimo_evento text, ADD COLUMN ultimo_contato timestamptz`; `CREATE OR REPLACE VIEW public.cobmais_latest_loft` (mantendo `security_invoker = true` e o `DISTINCT ON (cpf_cnpj)`) com as novas colunas.
- `src/pages/cobmais/lib/cobmaisXlsxImport.ts`: `COBMAIS_HEADERS` com as 12 colunas; nova checagem dedicada de CPF/CNPJ antes do `HeaderMismatchError`; helpers `parseBoolSimNao()` e `parseDateTimeBR()` (com teste unitário); `CobmaisSnapshotRow` e o mapeamento de colunas estendidos.
- `src/pages/portal-loft/lib/useCobmaisLoft.ts`: `CobmaisLoftRow` recebe `acordo`, `ultimoEvento`, `ultimoContato`, populados a partir da view.
- `src/pages/portal-loft/components/CobmaisLoftTable.tsx`: badge "Com acordo" e linha de evento/contato dentro da célula de status, usando Badge do design system e tokens já em uso na tela.
