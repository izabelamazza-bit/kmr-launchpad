# Revisão do token do cron e da memória de segurança

## 1. Sim, foi uma limitação técnica — confirmado

O agendamento roda dentro do banco (pg_cron executa um comando SQL). Um comando SQL agendado não tem acesso aos Secrets das Edge Functions — esses valores só existem no runtime das funções, não no Postgres. Por isso o valor precisa estar em algum lugar legível pelo banco no momento da execução, e a opção segura é uma tabela protegida.

Comando efetivamente agendado hoje (job `sync-credpago-diario`, `0 9 * * *` UTC = 06:00 Brasília):

```text
net.http_post(
  url := .../functions/v1/sync-credpago-api,
  headers := { 'x-cron-token': (select value from private.sync_secrets where name = 'credpago_cron') },
  body := '{}'
)
```

## 2. Onde o token fica e como está protegido (verificado no banco agora)

Tabela: `private.sync_secrets` (schema `private`, fora do schema `public`).

- O schema `private` **não** tem `USAGE` para `anon` nem para `authenticated` — verificado.
- A tabela tem RLS habilitado e **zero policies** — ou seja, nenhum acesso permitido por policy.
- A tabela **não tem nenhum GRANT** para `anon`, `authenticated` ou `service_role`.
- Como a API de dados só expõe o schema `public`, a tabela não é alcançável pelo app de forma alguma.

Quem consegue ler: apenas o dono do banco (`postgres`, usado pelo pg_cron) e a função `public.verify_sync_token`, que é `SECURITY DEFINER` e tem `EXECUTE` apenas para `postgres` e `service_role` — verificado (`{postgres=X/postgres,service_role=X/postgres}`). Usuário autenticado do sistema não lê o valor nem consegue chamar a função de verificação.

## 3. Dois segredos, ambos aceitos — e a recomendação

- `SYNC_INTERNAL_SECRET` (Secret da função, header `x-sync-secret`): continua válido, para chamadas internas/manuais fora do app.
- `x-cron-token` (valor em `private.sync_secrets`, nome `credpago_cron`): usado só pelo agendamento.
- JWT de usuário autenticado: caminho do botão manual dentro do app.

Na Edge Function `sync-credpago-api`, a função `autorizado()` aceita os três caminhos, nessa ordem, e retorna 401 se nenhum validar. Nenhum ficou obsoleto.

Ponto honesto: não confirmei se o valor gravado em `private.sync_secrets` é igual ou diferente do `SYNC_INTERNAL_SECRET` — comparar exigiria trazer o segredo para o contexto, o que evitei. A intenção da implementação foi gerar um valor separado (segredo por finalidade, rotação independente).

### Opções (escolha uma)

- **A — manter como está** (recomendado): três caminhos, cada um com finalidade clara.
- **B — enxugar**: remover o caminho `x-sync-secret` e deixar só JWT (app) + `x-cron-token` (cron). Menos superfície, um segredo interno a menos.

## 4. Memória de segurança

Não consigo reler o texto exato que foi gravado a partir daqui — a memória de segurança não é legível pelas ferramentas de consulta. Para você revisar antes de aceitar, o próximo passo é reescrevê-la com o texto abaixo, que passa a ser a versão vigente:

```text
## Sincronização CredPago (sync-credpago-api)

Três caminhos de autenticação, todos válidos e intencionais:
1. JWT de usuário autenticado — uso pelo app.
2. Header x-sync-secret conferido contra o Secret SYNC_INTERNAL_SECRET — chamadas internas/manuais.
3. Header x-cron-token conferido por public.verify_sync_token — usado apenas pelo pg_cron.
Sem nenhum deles: 401.

O caminho (3) existe porque um comando SQL agendado (pg_cron) não acessa Secrets de
Edge Functions. O token fica em private.sync_secrets, protegida por: schema private sem
USAGE para anon/authenticated, RLS habilitado sem policies, nenhum GRANT para roles da API.
Leitura só por postgres (pg_cron) e pela função SECURITY DEFINER public.verify_sync_token,
cujo EXECUTE está restrito a postgres e service_role.

Não sinalizar como vulnerabilidade: (a) private.sync_secrets com RLS sem policies — é
intencional e mais restritivo que qualquer policy; (b) funções SECURITY DEFINER
verify_sync_token / has_role / is_supervisor_or_admin — EXECUTE já revogado de
anon/authenticated; (c) uso do service role dentro da própria Edge Function.

Tokens nunca aparecem em log, resposta HTTP ou mensagem de erro da função.
```

## 5. Observação separada (não faz parte desta entrega)

`public.has_role` e `public.is_supervisor_or_admin` também estão com `EXECUTE` restrito a `postgres`/`service_role`. Verifiquei que **nenhuma** policy de RLS ativa hoje usa essas funções, então nada está quebrado. Mas se no futuro voltarem policies por papel, o `EXECUTE` para `authenticated` precisará ser reconcedido — vale registrar isso.

## Nada de código muda nesta entrega

Se aprovar como está: eu apenas reescrevo a memória de segurança com o texto da seção 4. Se preferir a opção B da seção 3, também ajusto a Edge Function.
