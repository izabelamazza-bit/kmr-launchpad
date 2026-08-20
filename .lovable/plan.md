# Memória de segurança: texto exato para revisão + rotação dos segredos

## 1. Decisão registrada

Os três caminhos de autenticação da função `sync-credpago-api` permanecem como estão — nada de enxugar. Cada um cobre um contexto de acesso distinto:

- JWT de usuário autenticado — botão dentro do app.
- Header `x-sync-secret`, conferido contra o Secret `SYNC_INTERNAL_SECRET` — chamadas manuais/externas.
- Header `x-cron-token`, conferido por `public.verify_sync_token` — pg_cron, que não lê Secrets de Edge Function.

Sem nenhum dos três: 401. Nenhum código muda nesta entrega.

## 2. Texto exato proposto para a memória de segurança

Este é o conteúdo integral que será gravado, sem nada além disto:

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

Rotação: cada segredo é trocado de forma independente, sem afetar os outros dois.
- SYNC_INTERNAL_SECRET: atualizar o Secret da Edge Function.
- credpago_cron (private.sync_secrets): atualizar o valor na tabela; o comando do cron
  lê o valor no momento da execução, então nada mais precisa mudar.
- JWT: expira/renova pelo próprio Supabase Auth, sem ação manual.

Não sinalizar como vulnerabilidade: (a) private.sync_secrets com RLS sem policies — é
intencional e mais restritivo que qualquer policy; (b) funções SECURITY DEFINER
verify_sync_token / has_role / is_supervisor_or_admin — EXECUTE já revogado de
anon/authenticated; (c) uso do service role dentro da própria Edge Function.

Tokens nunca aparecem em log, resposta HTTP ou mensagem de erro da função.
```

## 3. Resposta sobre rotação (confirmação, sem implementar nada)

Sim — trocar qualquer um dos três não exige mais do que atualizar o Secret ou a linha da tabela correspondente, e não quebra os outros dois. Os três são conferidos de forma isolada em `autorizado()` (verificado no código):

- `SYNC_INTERNAL_SECRET` é lido por `Deno.env.get` a cada requisição. Trocar o Secret passa a valer na próxima invocação, sem redeploy de lógica.
- `x-cron-token` é conferido contra `private.sync_secrets` (nome `credpago_cron`) via `verify_sync_token`. O comando agendado lê o valor da tabela na hora da execução, então basta um `UPDATE` na linha — o job continua igual, sem reagendar.
- O caminho JWT não depende de nenhum dos dois; a validação é feita pelo próprio Auth.

Ou seja: revogação de um segredo é uma alteração pontual, sem acoplamento entre os contextos.

## 4. O que acontece ao aprovar

Grava-se a memória de segurança exatamente com o texto da seção 2. Nenhum arquivo de código e nenhuma configuração de banco são alterados.
