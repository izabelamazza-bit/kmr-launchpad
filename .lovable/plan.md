# Redefinir Senha na aba Segurança (Editar usuário)

## Resposta à sua pergunta 1 (verificada no código)

`src/components/RequirePasswordChange.tsx` lê **os dois**, nesta ordem:

1. Primeiro lê `session.user.user_metadata.must_change_password` (Auth).
2. Depois consulta `users_registry.must_change_password` pelo `user_id` — e, se a linha existir, **esse valor sobrescreve** o do Auth (a tabela é a fonte da verdade; o metadata funciona só como fallback se o banco falhar).

A função `admin-reset-user-password` grava nos dois lugares (`updateUserById` com `user_metadata.must_change_password: true` e `update` em `users_registry`), portanto está escrevendo no lugar certo. O campo `warning` da resposta existe exatamente para o caso em que a senha troca no Auth mas a gravação no `users_registry` falha — nesse cenário a exigência de troca pode não valer, e o aviso precisa ser mostrado ao admin.

## O que será construído

Hoje o "Editar usuário" é um painel único sem abas. A entrega:

- Transformar o conteúdo do painel de edição em abas, seguindo o padrão visual já usado no sistema:
  - **Dados** — campos atuais (nome, e-mail, perfil, status).
  - **Segurança** — nova aba, visível apenas na edição (não em "Novo usuário") e apenas quando o usuário já tem conta no Auth.
- Na aba Segurança, seção "Redefinir senha" com o texto: "Gera uma nova senha temporária para o usuário. Escolha como repassá-la. O usuário deverá alterar a senha no próximo login."
- Dois botões lado a lado (empilhados no mobile), ambos desabilitados durante qualquer requisição:
  1. "Resetar e mostrar na tela" → `{ userId, method: "show" }`
  2. "Resetar e enviar por e-mail" → `{ userId, method: "email" }`
- Modo "show": ao retornar `success: true` e `password`, abre um diálogo destacado com a senha em fonte grande/monoespaçada, botão "Copiar" (com confirmação visual), o aviso fixo "Repasse esta senha ao usuário por um canal seguro. Ela não poderá ser recuperada depois de fechar esta tela.", o `warning` da resposta quando houver (explicando que a senha foi trocada mas a marcação de troca obrigatória pode não ter sido salva, e que a ação pode ser repetida), e botão "Fechar" que apaga a senha do estado.
- Modo "email": loading, toast de confirmação em caso de sucesso; como o envio ainda é um TODO na função, se vier erro exibe mensagem clara de que o envio por e-mail ainda não está disponível e que a opção "mostrar na tela" deve ser usada, sem quebrar a tela.
- Mensagens específicas por erro: 400 (dados inválidos), 401 (sessão expirada — entrar novamente), 404 (usuário não encontrado no Auth), 502 (falha ao atualizar a senha no serviço de autenticação), e fallback para erros de rede.

## Detalhes técnicos

- Novo componente `src/pages/cadastros/components/ResetPasswordSection.tsx` (seção + diálogo da senha), consumido pelo `FormSheet` de `src/pages/cadastros/Users.tsx`.
- Chamada via `supabase.functions.invoke("admin-reset-user-password", { body })`; o status HTTP é lido de `FunctionsHttpError.context.status` para mapear as mensagens, com fallback no campo `error` do corpo.
- Senha guardada só em estado local do diálogo, limpa no fechar/desmontar; nunca em log, nunca em `console`.
- Nenhuma mudança de banco nem na edge function.

## Verificação (item 2 do seu pedido)

Após implementar, testo com o usuário Daniel Moura via navegador na tela `/cadastros/usuarios`: método "show", confirmo a senha no modal, faço login real com ela em uma sessão separada e confirmo o redirecionamento obrigatório para `/trocar-senha`. Reporto o resultado com evidência de tela. Se o Daniel não tiver conta no Auth vinculada, aviso antes de testar.
