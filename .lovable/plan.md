
# Simplificar acesso (sem roles) + exclusão definitiva de usuário

## 1. Backend — RLS uniforme: autenticado = tudo

Migração única cobrindo todas as tabelas e o storage que ainda têm gate por role. Regra: qualquer policy passa a ser `auth.uid() IS NOT NULL` para SELECT/INSERT/UPDATE/DELETE.

Policies recriadas:

- **`agent_config`** — remover as 3 policies com `is_supervisor_or_admin` (INSERT/UPDATE/DELETE) e substituir por versões autenticadas.
- **`users_registry`** — recriar INSERT/UPDATE/DELETE sem `is_supervisor_or_admin`.
- **`user_roles`** — recriar SELECT como `auth.uid() IS NOT NULL` (a tabela continua existindo por causa da FK/histórico, mas deixa de gatear qualquer coisa).
- **`storage.objects` bucket `sinistros`** — recriar as 4 policies (SELECT/INSERT/UPDATE/DELETE) só exigindo `bucket_id = 'sinistros' AND auth.uid() IS NOT NULL` (remove o join com `sinistros.created_by`/`is_supervisor_or_admin`).
- **`audit_contracts_insert`** — trocar `WITH CHECK (created_by = auth.uid())` por `auth.uid() IS NOT NULL` (a coluna continua sendo preenchida pelo app para auditoria, mas não bloqueia).

Função `is_supervisor_or_admin` e `has_role` **permanecem** no banco (não removo para não quebrar dependências residuais), mas deixam de ser referenciadas por qualquer policy do app.

## 2. Frontend — remover gates de role

- **`src/hooks/useUserRole.ts`** — simplificar: manter export por compatibilidade, mas `isSupervisorOrAdmin` sempre retorna `true` para usuário autenticado (evita cascata de edits em telas que ainda importam o hook).
- **`src/pages/Configuracoes.tsx`** — remover o bloqueio "Sem permissão" (qualquer autenticado acessa).
- **`src/pages/auditoria/AuditoriaContrato.tsx`** — remover `useUserRole`/`isSupervisorOrAdmin` (select de analista já está livre).
- **`src/pages/auditoria/Auditoria.tsx`** — remover a dependência `isSupervisorOrAdmin` do `useMemo` (filtro já aparece para todos).

Coluna `analyst_id` e a atribuição automática (`analyst_id = user.id` quando vazio) **permanecem** — é só metadado de "quem cadastrou/está responsável", não gate de permissão.

## 3. Exclusão definitiva de usuário

Problema atual: `Users.tsx` só faz `delete` em `users_registry`. O usuário continua no `auth.users` (login válido) e o `users_registry` do outro registro pode reaparecer via reprocessamento. Além disso, o e-mail fica preso no Auth.

Solução:

- **Nova edge function `admin-delete-user`** (`supabase/functions/admin-delete-user/index.ts`) — recebe `user_id` (auth uid). Valida sessão (`auth.getUser`) e executa via service role:
  1. `admin.auth.admin.deleteUser(user_id)` — remove do Auth (libera o e-mail).
  2. `delete from users_registry where user_id = $1` — remove o registro.
  3. `delete from user_roles where user_id = $1` — limpa role remanescente.
  - Retorna `{ success: true }`. Sem checagem de role (qualquer autenticado pode).
- **Registrar em `supabase/config.toml`** com `verify_jwt = true`.
- **`src/pages/cadastros/Users.tsx`** — trocar o `handleDelete` atual por `supabase.functions.invoke("admin-delete-user", { body: { user_id: deleteItem.user_id } })`. Tratar erro (toast). Se `user_id` for null (registro órfão sem Auth), fazer só o delete direto na tabela como fallback.

## Fora do escopo

- Não altero `admin-create-user` (já funciona; só passa a permitir qualquer autenticado criar, o que já era o caso na prática).
- Não removo a exigência de troca de senha no primeiro login.
- Não mexo em `extract-contract` nem em nenhuma outra edge function.

## Validação

- Login como qualquer usuário (não-admin) → abrir Auditoria, Configurações, criar/editar/deletar contrato, subir PDF, sem erro.
- Deletar um usuário de teste na tela de Usuários → some da lista imediatamente; recadastrar o mesmo e-mail funciona sem "já existe".
