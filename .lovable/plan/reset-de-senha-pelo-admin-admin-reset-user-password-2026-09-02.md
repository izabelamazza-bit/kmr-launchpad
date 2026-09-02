# Reset de senha pelo admin (`admin-reset-user-password`)

Nova função de backend que gera uma senha temporária para um usuário e obriga a troca no próximo login. Nenhuma tela muda nesta entrega — só a função, pronta para o frontend chamar.

## Comportamento

- Recebe `{ userId, method }`, onde `method` é `"show"` ou `"email"`.
- Exige usuário autenticado (JWT). Sem checagem de perfil, mas o executor é identificado e registrado.
- Gera senha aleatória de 10 caracteres com ao menos 1 maiúscula, 1 minúscula e 1 número (via `crypto.getRandomValues`, com embaralhamento).
- Atualiza a senha no Auth do usuário-alvo.
- Marca `must_change_password = true` no cadastro de usuários — o campo já existe em `users_registry` e é o mesmo usado hoje no primeiro acesso, então será reutilizado. Nenhuma migração necessária.
- `method = "show"`: retorna `{ success: true, password: "<temporária>" }` para exibir ao admin na tela.
- `method = "email"`: retorna `{ success: true }` sem a senha, com um `TODO` marcado no código no ponto exato do envio de e-mail (próxima entrega).

## Erros retornados ao frontend

- 400: `userId` ausente/inválido ou `method` fora de `show`/`email`.
- 401: sem JWT válido.
- 404: usuário não encontrado no Auth.
- 502: falha da Admin API ao trocar a senha (mensagem original repassada).
- Se a senha do Auth for trocada mas a marcação de troca obrigatória falhar, a resposta traz `warning` explicando que o usuário não será forçado a trocar a senha.

## Auditoria

O projeto não tem tabela de audit log. A ação será registrada com `console.log` estruturado: id do executor, id do usuário-alvo, `method` e timestamp. A senha temporária nunca aparece em log — apenas no corpo da resposta no caso `show`.

## Detalhes técnicos

- Arquivo: `supabase/functions/admin-reset-user-password/index.ts`.
- Mesmo padrão das funções `admin-create-user` / `admin-delete-user`: CORS, cliente com JWT do chamador para identificar quem executa, cliente service role para `auth.admin.updateUserById` e para escrever em `users_registry`.
- Validação do usuário-alvo com `auth.admin.getUserById` antes de tentar a troca, para diferenciar 404 de falha da Admin API.
- `users_registry` é atualizado por `user_id`; também é gravado `must_change_password: true` no `user_metadata` do Auth, mantendo a consistência com `admin-create-user` e com o `RequirePasswordChange`.
- `verify_jwt` fica no padrão do projeto e a validação do JWT é feita em código.
- Deploy da função ao final.
