

## Autenticação real + primeiro usuário + dashboard protegido

### 1. Solicitar credenciais via secrets
- **FIRST_USER_EMAIL** — email do primeiro usuário
- **FIRST_USER_PASSWORD** — senha do primeiro usuário
- **FIRST_USER_NAME** — nome do primeiro usuário

### 2. Habilitar auto-confirm de email
Usar `configure_auth` para que o primeiro usuário possa logar imediatamente sem precisar confirmar email.

### 3. Criar edge function `create-first-user`
- Usar `SUPABASE_SERVICE_ROLE_KEY` para chamar `supabase.auth.admin.createUser()` com os dados dos secrets
- Definir `email_confirm: true` para já confirmar o email
- Configurar `verify_jwt = false` no `config.toml`
- Endpoint único para ser chamado uma vez

### 4. Atualizar `src/pages/Login.tsx`
- Importar o client do Supabase
- Substituir o toast por `supabase.auth.signInWithPassword({ email, password })`
- Mostrar loading state no botão
- Exibir erros de autenticação via toast
- Em caso de sucesso, redirecionar para `/dashboard` usando `useNavigate`

### 5. Criar `src/pages/Dashboard.tsx`
- Verificar sessão com `supabase.auth.getSession()` + listener `onAuthStateChange`
- Se não autenticado, redirecionar para `/login`
- Exibir nome/email do usuário logado
- Botão de logout que chama `supabase.auth.signOut()` e redireciona para `/login`
- Layout simples com header e conteúdo placeholder

### 6. Atualizar `src/App.tsx`
- Adicionar rota `/dashboard` apontando para a nova página

### Ordem de execução
1. Solicitar os 3 secrets (nome, email, senha)
2. Habilitar auto-confirm
3. Criar e deployar a edge function
4. Chamar a edge function para criar o usuário
5. Implementar login real + dashboard + rota

