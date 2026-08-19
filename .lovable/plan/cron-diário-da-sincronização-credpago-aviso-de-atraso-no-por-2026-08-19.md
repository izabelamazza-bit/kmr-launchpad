# Cron diário da sincronização CredPago + aviso de atraso no Portal Loft

## 1. Agendamento diário (06:00 Brasília)

Um único job `pg_cron`, chamando `sync-credpago-api` **sem** `recurso` (processa contratos, inadimplencia e movimentacoes em sequência):

- Horário: `0 9 * * *` em UTC = 06:00 em Brasília (UTC-3).
- Autenticação da chamada pelo header `x-sync-secret` (secret `SYNC_INTERNAL_SECRET`, já existente).
- Extensões `pg_cron` e `pg_net` habilitadas.
- Nome do job: `sync-credpago-diario`. Nenhum outro job é criado nesta entrega.

A validação `paginacao_consistente` permanece exatamente como está: o recurso que falhar a checagem entra como erro no resumo daquela execução e não grava nada; os outros seguem gravando normalmente.

## 2. Cabeçalho do Portal Loft: última sincronização por recurso e origem

Hoje o cabeçalho já mostra data/hora por tipo (contratos, movimentações, inadimplência), mas **sem distinguir origem** — uma importação manual de CSV aparece igual a uma da API.

Ajuste:
- Para cada um dos 3 tipos, mostrar a data/hora mais recente **e** a origem correspondente (`API` ou `Manual`), lendo `origem` de `guarantor_portal_imports`.
- Passa a existir também, por tipo, a data da última importação com `origem = 'api'`, usada no banner.

## 3. Banner "Sincronização atrasada"

Banner simples no topo da tela (acima do conteúdo, dentro do `main`), exibido quando **qualquer** um dos 3 recursos não tiver importação com `origem = 'api'` nas últimas 30 horas (inclui o caso de nunca ter rodado).

Texto: "Sincronização atrasada" + lista dos recursos em atraso com a última data conhecida. Sem retry, sem e-mail, sem histórico de falhas — nada além disso.

## 4. "Última atualização" (indicador "sem retorno da Loft")

Confirmado por leitura do código: **já considera** a maior data entre pendência e nota. `buildPendenciaIndex` recebe o índice de notas de `useCaseNotes` e faz o `maisRecenteDe` com a nota mais recente do contrato; `CobmaisLoftPanel` passa esse índice. O comentário antigo já foi atualizado.

Uma lacuna real permanece e será corrigida: a nota só é aplicada quando o contrato **já tem pendência**. Contrato com movimentação recente e nenhuma pendência fica fora do índice. Ajuste: considerar a nota mesmo sem pendência, de forma que o cálculo de dias sem retorno use a movimentação nesses casos.

## Detalhes técnicos

- SQL de agendamento via ferramenta de insert (contém URL e chave do projeto), não migração: `create extension` para `pg_cron`/`pg_net` + `cron.schedule('sync-credpago-diario','0 9 * * *', $$ select net.http_post(url:=<função>, headers:=jsonb com Content-Type, apikey e x-sync-secret, body:='{}'::jsonb) $$)`. Antes, `cron.unschedule` defensivo se o nome já existir.
- `src/pages/portal-loft/lib/usePortalLoft.ts`: a consulta de `todas` passa a selecionar `tipo, origem, data_importacao`; `ultimas` vira `{ tipo: { data, origem } }` e ganha `ultimasApi` por tipo. Novo derivado `recursosAtrasados` (limite 30h).
- `src/pages/portal-loft/PortalLoft.tsx`: renderiza origem ao lado de cada data e o banner de atraso (Alert do shadcn, variante destrutiva discreta, tokens do design system).
- `src/pages/portal-loft/lib/useInadimplenciaLoft.ts`: em `buildPendenciaIndex`, criar entrada derivada de nota quando não houver pendência para aquele contrato — sem `maisRecente`, então `PendenciaResumoContrato.maisRecente` passa a ser opcional e `estaParado` trata a ausência de status como caso aberto. Ajustes de tipo em `SinistroLoftBadge`/`CobmaisLoftTable` onde `maisRecente` é lido.
- Nenhuma mudança na Edge Function.

## Confirmações pedidas

**1. Como investigar uma chamada que falhou silenciosamente**

Sim, dá para auditar depois, em dois lugares:

- `cron.job_run_details` — registra cada disparo do agendamento (início, fim, status, mensagem). Prova que o cron rodou.
- `net._http_response` — tabela do próprio `pg_net` com o resultado de cada `net.http_post` (status HTTP, corpo da resposta, mensagem de erro em caso de timeout/erro de rede), casada pelo `id` do request. Atenção: o `pg_net` mantém essas linhas por poucas horas (retenção curta por padrão), então a consulta serve para investigar no mesmo dia — o banner de 30h continua sendo o sinal de longo prazo.
- Como o resumo por recurso já é devolvido no corpo da resposta HTTP, o `response_body` em `net._http_response` traz o JSON completo daquela execução (lidos, gravados, `paginacao_consistente`, erros).

Vou entregar as duas consultas prontas ao final para você rodar quando quiser investigar.

**2. `cron.unschedule` defensivo**

Sim — a remoção é feita apenas quando existe um job com o nome exato `sync-credpago-diario`, dentro de um `if exists (select 1 from cron.job where jobname = 'sync-credpago-diario')`. Nenhum outro job é lido, alterado ou removido. Hoje, aliás, não existe nenhum job agendado no projeto (o `pg_cron` ainda não está instalado).

## Ajuste no detalhe técnico do agendamento (autenticação do cron)

O valor do secret `SYNC_INTERNAL_SECRET` não é legível por mim (secrets são armazenados criptografados), então não posso embutir esse valor no comando do cron. Em vez de rotacionar o secret, o agendamento usa um token próprio guardado no banco:

- Migração cria o schema privado `private` com a tabela `private.sync_secrets` e um token aleatório para o nome `credpago_cron`. O schema não é exposto pela API e não tem permissão para `anon`/`authenticated`.
- Função `public.verify_sync_token(_token)` (security definer, `execute` só para `service_role`) confere o token.
- A Edge Function passa a aceitar, além do JWT e do `x-sync-secret` já existentes, o header `x-cron-token`, validado por essa função.
- O comando do cron lê o token do banco na hora da execução (`select value from private.sync_secrets where name = 'credpago_cron'`), então nenhum segredo fica em texto no meu lado nem precisa ser rotacionado.
