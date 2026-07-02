## Diagnóstico confirmado

- O registro do usuário `operacao01@siscob.tec.br` ainda está com `users_registry.must_change_password = true` no banco.
- A tela anterior aceitava a nova senha e redirecionava mesmo que a persistência da flag no banco falhasse, porque a RPC `clear_must_change_password` estava dentro de um `try/catch` silencioso.
- O `RequirePasswordChange` lê metadata e depois consulta o banco; como o banco continuava `true`, ele redirecionava o usuário de volta para `/trocar-senha`, criando o loop.

## Plano de correção

1. **Definir fonte única de verdade**
   - Ajustar `RequirePasswordChange` para considerar o banco (`users_registry.must_change_password`) como fonte principal.
   - Usar `user_metadata.must_change_password` apenas como fallback quando não houver registro no banco ou a consulta falhar.

2. **Remover sucesso falso na troca de senha**
   - Ajustar `TrocarSenha.tsx` para não mascarar erro da RPC.
   - Após `updateUser`, executar `clear_must_change_password` e validar que a flag ficou `false` no banco antes de redirecionar.
   - Se a persistência falhar, mostrar erro claro e não enviar o usuário para o dashboard, evitando o ciclo.

3. **Evitar corrida entre troca de senha e guard de rota**
   - Fazer a página `/trocar-senha` persistir a flag no banco antes do `navigate('/dashboard')`.
   - Fazer o guard tratar `/trocar-senha` como rota permitida durante a verificação, sem redirecionar prematuramente com metadata desatualizado.

4. **Corrigir a flag atual do usuário afetado**
   - Criar uma migração pontual para marcar `must_change_password = false` para `operacao01@siscob.tec.br`, já que a senha forte foi aceita mas a flag ficou presa em `true`.
   - Não alterar senha, permissões ou papéis do usuário.

5. **Validar estabilidade**
   - Confirmar via banco que a flag permanece `false`.
   - Verificar no app que o usuário autenticado não volta automaticamente para `/trocar-senha` quando a flag estiver `false`.

## Arquivos previstos

- `src/components/RequirePasswordChange.tsx`
- `src/pages/TrocarSenha.tsx`
- Nova migration para corrigir a flag do usuário afetado