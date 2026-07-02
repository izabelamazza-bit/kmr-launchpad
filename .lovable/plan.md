# Plano — 3 ajustes

## 1. Renomear Seção A na auditoria de contrato

**Arquivo:** `src/pages/auditoria/AuditoriaContrato.tsx` (linha 712)

Trocar o título do card de:
- `Seção A — Dados manuais`

para:
- `Seção A — Dados do Imoview`

Nenhum campo, lógica ou funcionalidade é alterado.

## 2. Limpar cards do Dashboard

**Arquivo:** `src/pages/Dashboard.tsx`

No array `menuItems`, remover as 3 entradas: **Empresas**, **Pessoas** e **Produtos e Serviços**.

Manter intactos: Usuários, Leads, Agente de IA, Atendimento, Sinistros, Auditoria, Configurações, o bloco "Registrar novo sinistro" e o resto da tela. As rotas (`/cadastros/empresas`, `/cadastros/pessoas`, `/cadastros/produtos-servicos`) e os dados no banco permanecem.

## 3. Cadastro de usuário com senha inicial e troca obrigatória no 1º login

Hoje `src/pages/cadastros/Users.tsx` grava apenas em `users_registry` (tabela informativa) e não cria usuário real em `auth.users`. Vamos passar a criar o usuário de verdade e forçar troca de senha no primeiro login.

### 3.1 Backend

**Migração**
- Adicionar coluna `must_change_password boolean not null default true` em `public.users_registry`.
- Ajustar a lista de perfis usada na UI para apenas **Analista** e **Supervisor** (a coluna `access_profile` continua text, sem CHECK novo — apenas o front restringe).
- RPC `public.clear_must_change_password()` (security definer) que faz `update users_registry set must_change_password = false where user_id = auth.uid()`.

**Edge Function `admin-create-user`** (`verify_jwt = false`, validação em código)
- Recebe `{ full_name, email, password, access_profile }`.
- Valida JWT do chamador via `SUPABASE_ANON_KEY` client e confirma que o solicitante tem role `admin` ou `supervisor` (via `has_role`).
- Zod: email válido, senha ≥ 8 chars, `access_profile ∈ {analista, supervisor}`.
- Usa `service_role` para:
  1. `auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name, must_change_password: true } })`.
  2. `insert` em `users_registry` com `user_id = data.user.id`, `must_change_password = true`, `status = 'ativo'`.
  3. `insert` em `user_roles` com o role escolhido (mapeando `analista`/`supervisor` para o enum `app_role`).
- Retorna 200 ou erro estruturado (email duplicado → mensagem clara).

### 3.2 Frontend — tela `/cadastros/usuarios`

Simplificar o form "Novo usuário" para os campos pedidos:
- Nome completo
- E-mail
- Perfil: **Analista** ou **Supervisor** (default Analista)
- Senha inicial (com toggle mostrar/ocultar, mínimo 8)
- Confirmar senha

Ao submeter (modo criação): chamar `supabase.functions.invoke("admin-create-user", ...)` em vez de inserir direto. Toast de sucesso: "Usuário criado. Ele poderá logar com o e-mail e a senha informados."

Edição continua editando `users_registry` + permitindo trocar `access_profile` entre Analista/Supervisor (o role também é atualizado via a mesma edge function em modo update — ou uma segunda função `admin-update-user-role`). Mantemos o comportamento existente para os demais campos.

Remover a lista antiga de perfis (admin/user/manager) da UI — passa a exibir só Analista/Supervisor.

### 3.3 Troca obrigatória de senha no 1º login

**Nova rota pública-autenticada:** `/trocar-senha` (`src/pages/TrocarSenha.tsx`)
- Campos: nova senha + confirmação (mín. 8).
- Chama `supabase.auth.updateUser({ password, data: { must_change_password: false } })` e depois RPC `clear_must_change_password`.
- Sucesso → redireciona para `/dashboard`.
- Sem link "voltar"/"pular"; logout disponível.

**Guard global:** criar `src/components/RequirePasswordChange.tsx` que envolve as rotas protegidas em `App.tsx`. Ele lê `session.user.user_metadata.must_change_password` (ou consulta `users_registry.must_change_password`) e:
- Se `true` e rota atual ≠ `/trocar-senha` → `<Navigate to="/trocar-senha" replace />`.
- Se `false` e rota = `/trocar-senha` → redireciona para `/dashboard`.

Isso garante que o usuário não consegue acessar nenhuma outra tela antes de trocar.

### 3.4 Acesso completo por padrão

Todas as telas já são acessíveis a qualquer usuário autenticado (não há gating por role hoje, exceto `useUserRole` usado pontualmente em auditoria). Portanto basta garantir que:
- O novo usuário recebe uma entrada em `user_roles` com o perfil escolhido.
- Nenhuma rota nova é restringida.

## Fora de escopo
- Não mexer em dados existentes, RLS de outras tabelas, ou nas telas Empresas/Pessoas/Produtos (só some do dashboard).
- Não trocar o enum `app_role` (mantemos `admin`/`supervisor`/`analista`).
