# Paginação determinística na sincronização CredPago

Antes de rodar `inadimplencia`/`movimentacoes` e agendar o cron, tratar a causa raiz da triplicação: a paginação por offset sem ordenação estável.

## Estado atual confirmado

A função monta a URL apenas com `limit` e `offset` (`?limit=500&offset=N`) — **nenhum `order_by`/`order_dir` é enviado** em nenhum dos três recursos. Ou seja, a ordem fica a critério do padrão da API, o que explica registros repetidos entre páginas e abre a possibilidade de registros **pulados**, que o dedupe atual não detectaria.

## O que vou fazer

### 1. Descobrir os parâmetros de ordenação aceitos pela API
Antes de fixar a ordenação, testar contra a API real (uma página pequena, `limit=5`) qual formato ela aceita: `order_by`/`order_dir`, `sort`/`order`, ou `orderBy`. Critério de aceite: enviar o parâmetro duas vezes com `ASC` e `DESC` e obter conjuntos diferentes/invertidos — prova de que a API respeita o parâmetro em vez de ignorá-lo silenciosamente. Se a API ignorar qualquer forma de ordenação, sigo para o plano B (item 5) e reporto isso antes de agendar o cron.

### 2. Enviar ordenação explícita em todas as páginas dos 3 recursos
Ordenação por coluna única e estável:
- `contratos`: `contrato` (identificador único do contrato)
- `inadimplencia`: `id` (vira `pendencia_id`)
- `movimentacoes`: `id` (vira `nota_id`)

Direção `ASC` fixa. Coluna definida por recurso em um único ponto do código.

### 3. Reimportar `contratos` do zero e provar a estabilidade
- Apagar a importação de contratos criada pela API (o import e seus snapshots), preservando as importações manuais de CSV.
- Rodar `recurso=contratos` novamente.
- Prova exigida: **soma dos itens lidos em todas as páginas == campo `total` do envelope da API**, exatamente. Vou reportar os dois números lado a lado, mais a contagem de ids distintos. Se `lidos > total` ou `ids distintos < total`, a paginação ainda está instável e não avanço.
- Verificação extra de "pulos": comparar o conjunto de ids da API com o conjunto de ids da última importação manual de CSV — listar o que existe no CSV e não veio pela API.

### 4. Investigar os 8 contratos a mais (2.254 vs ~2.246)
Para cada contrato presente na importação da API e ausente no CSV manual:
- checar `data_criacao` — se for posterior à data do CSV, é contrato novo (esperado);
- checar se existe um "irmão" no CSV que difere só por espaço, zero à esquerda, caixa ou pontuação (normalizando o código) — isso indicaria duplicata que o dedupe por `contrato` não pegou.

Reporto a classificação dos 8, um a um.

### 5. Plano B, se a API não suportar ordenação
Trocar o dedupe silencioso por uma leitura verificada: manter a paginação, mas comparar ao final `ids distintos` com `total`; se faltar registro, refazer a leitura com páginas menores (`limit=200`) e sobreposição, e falhar explicitamente no resumo em vez de gravar dados incompletos. Nada é agendado enquanto a leitura não fechar com o `total`.

### 6. Só então: `inadimplencia` e `movimentacoes`
Rodar cada um separadamente e aplicar a mesma prova (lidos == `total`, distintos == `total`). Só depois de os três fecharem, tratar o agendamento do cron — que fica como passo seguinte, em outra entrega.

## Detalhes técnicos

- `supabase/functions/sync-credpago-api/index.ts`: acrescentar a ordenação em `fetchPagina` (a partir de um mapa `ORDER_BY` por recurso), e em `coletar` registrar/retornar `total` informado vs `lidos` vs `distintos` para compor a prova no resumo JSON.
- O resumo JSON passa a incluir, por recurso: `total_api`, `lidos`, `distintos`, `duplicados_descartados` e um booleano `paginacao_consistente`. Quando `paginacao_consistente = false`, o recurso é registrado como erro.
- O dedupe atual permanece como rede de segurança, mas deixa de ser o mecanismo que esconde o problema.
- Nenhuma tela muda nesta entrega.