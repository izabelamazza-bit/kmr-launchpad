## Diagnóstico

A perda de scroll ao voltar para a aba **não é comportamento do navegador** — é causada pelo componente `RequirePasswordChange`, que envolve toda a árvore autenticada em `App.tsx`.

Fluxo do bug:
1. Usuário troca de aba → tab volta a ficar visível.
2. Supabase dispara um evento (`TOKEN_REFRESHED` ou `SIGNED_IN`) via `onAuthStateChange`.
3. `RequirePasswordChange` atualiza `session` no state.
4. O 2º `useEffect` roda de novo (depende de `session`) e faz `setChecked(false)`.
5. Enquanto `checked=false`, o componente retorna `null` — **desmonta a página inteira**.
6. Quando termina a checagem, remonta do zero → scroll volta para o topo.

Ou seja: perdemos scroll toda vez que a sessão é revalidada, o que acontece ao trocar de aba.

## Correção

Em `src/components/RequirePasswordChange.tsx`:

- Manter `checked` como "primeira checagem concluída" (usar `useRef` ou só setar `true` uma vez, sem voltar a `false` em rechecagens).
- Renderizar os `children` assim que a **primeira** verificação terminar; rechecagens subsequentes rodam em background sem desmontar a árvore.
- Se após uma rechecagem a política mudar (ex.: `must_change_password` virou true), o `navigate("/trocar-senha")` continua funcionando normalmente.

Mudança específica:
```ts
// remove: setChecked(false) no início do run()
// mantém apenas: setChecked(true) no finally
```

Isso preserva o scroll porque a árvore nunca é desmontada após a primeira montagem.

## Validação

1. Abrir `/auditoria`, rolar até o meio da tabela.
2. Trocar para outra aba do navegador por 5–10s e voltar.
3. Confirmar que a página continua na mesma posição de scroll.
4. Repetir em `/auditoria/:id` (tela de checklist) enquanto preenche itens no meio da página.
5. Confirmar que o fluxo de "trocar senha obrigatório" continua funcionando para novos usuários.

## Arquivos alterados

- `src/components/RequirePasswordChange.tsx` — não resetar `checked` em rechecagens de sessão.
