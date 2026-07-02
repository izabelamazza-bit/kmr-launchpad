## Causa raiz

A correção de segurança anterior habilitou o **HIBP (HaveIBeenPwned)** no Supabase Auth — o servidor agora rejeita qualquer senha que apareça em vazamentos públicos conhecidos. Quando o analista tenta definir uma senha comum ("senha123", "kmr2025", data de nascimento, etc.), o `supabase.auth.updateUser({ password })` retorna um erro do tipo `weak_password / pwned password`. A tela `TrocarSenha.tsx` hoje só ecoa `error.message`, que aparece traduzido/genérico como **"a senha já foi usada"**, dando a falsa impressão de que é histórico de senhas.

Como o `updateUser` falha, o código retorna antes de chamar `clear_must_change_password` e antes do `navigate('/dashboard')` → a flag continua `true` no `users_registry` e no `user_metadata`, e o `RequirePasswordChange` mantém o usuário preso em `/trocar-senha`. Não é loop nem race condition — é o servidor recusando toda tentativa por serem senhas fracas conhecidas.

Verificações feitas:
- `users_registry` do analista atual: `must_change_password = true` (correto — nunca conseguiu trocar).
- Policy `Admins or self can update users_registry` permite `user_id = auth.uid()` → a RPC `clear_must_change_password` (agora `SECURITY INVOKER`) funciona sem problema quando executada.
- `RequirePasswordChange` já escuta `onAuthStateChange`, então quando `USER_UPDATED` disparar (após um `updateUser` bem-sucedido), o metadata `must_change_password: false` chega e libera o dashboard — não precisa mexer.

## Correção

Ajustar **apenas** `src/pages/TrocarSenha.tsx`:

1. **Mensagens claras**: mapear o erro do Supabase e mostrar título específico quando a senha for rejeitada pelo HIBP ("Escolha uma senha mais forte — esta aparece em vazamentos públicos"), diferenciando de "nova precisa ser diferente da atual".
2. **Requisitos visíveis em tempo real**: checklist embaixo do campo (mínimo 8 chars, uma letra, um número, símbolo recomendado) e aviso sobre senhas comuns bloqueadas.
3. **Botão desabilitado** enquanto os requisitos mínimos não forem atendidos — reduz tentativas rejeitadas.
4. **RPC resiliente**: envolver `clear_must_change_password` em `try/catch` — se falhar, o `user_metadata: { must_change_password: false }` já basta para o `RequirePasswordChange` liberar o acesso; sem travar o redirecionamento.

Nada muda no backend (policies, funções, edge functions) — a lógica está correta; o que faltava era comunicação e UX.

## Teste após aplicar

1. Login com o usuário `operacao01@siscob.tec.br`.
2. Tentar "senha123" → erro específico "Escolha uma senha mais forte…".
3. Definir uma senha forte (ex.: `Kmr@2026!Ok`) → sucesso, redirecionamento automático ao dashboard.
4. Confirmar no banco que `users_registry.must_change_password = false` para esse usuário.

## Detalhes técnicos

Arquivo alterado: `src/pages/TrocarSenha.tsx`. Adiciona checklist reativo, mapeamento de mensagens de erro (`pwned`, `weak`, `leaked`, `compromised`, `data breach`, `different from the old`) e `try/catch` na RPC. Sem novas dependências, sem migração.