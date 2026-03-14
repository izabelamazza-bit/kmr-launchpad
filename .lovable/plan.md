

## Adicionar botão Login e página de Login

### 1. Atualizar `src/components/landing/Header.tsx`
- Adicionar botão "Login" após o botão "Agendar demonstração" (desktop e mobile)
- Usar `Link` do react-router-dom para navegar para `/login`
- Estilo: variant `outline` para diferenciar do CTA verde

### 2. Criar `src/pages/Login.tsx`
- Página com formulário centralizado (email + senha)
- Usar componentes shadcn/ui existentes (Card, Input, Label, Button)
- Validação básica dos campos (required)
- Link para voltar à landing page
- Logo KMR no topo do formulário
- Por enquanto apenas UI (sem backend/Supabase) — submit mostra toast de confirmação

### 3. Atualizar `src/App.tsx`
- Adicionar rota `/login` apontando para a nova página

