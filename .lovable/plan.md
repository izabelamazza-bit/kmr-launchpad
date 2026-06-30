# Plano: Configurar a chave da Anthropic

## Contexto importante

No Lovable Cloud **não temos acesso à Service Role Key** nem à API de gerenciamento de secrets do Supabase a partir de uma Edge Function. Ou seja, **não é tecnicamente possível** criar uma Edge Function `save-api-key` que grave um secret no servidor a partir de um input do frontend — qualquer tentativa exigiria expor uma credencial de admin no backend, o que é inseguro e quebraria a política da plataforma.

A forma correta e segura de cadastrar `ANTHROPIC_API_KEY` é usar o **formulário seguro de secrets do Lovable** (ferramenta `add_secret`). Esse formulário:

- abre direto no chat
- o valor é digitado pelo usuário e enviado criptografado para o cofre de secrets
- fica disponível como `Deno.env.get("ANTHROPIC_API_KEY")` em todas as Edge Functions
- nunca passa pelo código do frontend nem fica logado

## O que será feito

### 1. Provisionar o secret `ANTHROPIC_API_KEY`
Disparar o formulário seguro de secret (ferramenta interna). Você cola a chave uma única vez, ela fica salva no cofre.

### 2. Tela administrativa de status da chave (`/configuracoes`)
Como a gravação não pode ser feita via UI custom, a tela vai servir para **visualizar o status** e **orientar a troca**:

- Nova rota `/configuracoes` no menu do Dashboard (ícone de engrenagem, restrita a `admin`/`supervisor` via `useUserRole`).
- Card "Integrações de IA" com a linha **Chave da API Anthropic (ANTHROPIC_API_KEY)**:
  - Se configurada: mostra `sk-ant-••••••••` + badge verde "Ativa — leitura de PDF habilitada".
  - Se ausente: badge cinza "Não configurada" + alerta de que a leitura de PDF da Seção B fica inativa.
  - Botão **"Configurar/Substituir chave"** que, ao ser clicado, exibe instruções curtas pedindo para você enviar no chat: *"quero atualizar a chave da Anthropic"* — isso dispara o formulário seguro do Lovable.

### 3. Edge Function `anthropic-key-status` (somente leitura)
- Valida JWT e papel admin/supervisor.
- Retorna `{ configured: boolean, masked: string | null }` lendo `Deno.env.get("ANTHROPIC_API_KEY")`.
- **Nunca** retorna o valor real, apenas máscara dos últimos 4 caracteres.
- Sem escrita — gravação é exclusiva via formulário seguro do Lovable.

### 4. Atualizar `extract-contract` para usar a chave
- Substituir o mock atual pela chamada real à Anthropic (`claude-sonnet-4`) quando `ANTHROPIC_API_KEY` estiver presente.
- Se a chave estiver ausente, manter fallback de mensagem clara "Chave Anthropic não configurada — configure em /configuracoes".

## Por que não fazer uma Edge Function `save-api-key` que grava o secret

1. Exigiria a Service Role Key + API Management do Supabase no runtime, que **não estão disponíveis no Lovable Cloud**.
2. Mesmo em projetos self-hosted, expor escrita de secrets via endpoint HTTP cria um vetor de privilege escalation (qualquer bug de autorização viraria comprometimento total).
3. O formulário do Lovable cumpre exatamente o requisito ("inserir sem entrar no painel do Supabase") de forma segura.

## Arquivos a criar/editar

- `src/pages/Configuracoes.tsx` — nova tela de status + instruções.
- `src/App.tsx` — registrar rota `/configuracoes`.
- `src/pages/Dashboard.tsx` — adicionar card "Configurações" no menu.
- `supabase/functions/anthropic-key-status/index.ts` — leitura de status.
- `supabase/functions/extract-contract/index.ts` — integrar chamada real à Anthropic.

## Confirmação necessária

Confirma que posso seguir por esse caminho (formulário seguro do Lovable + tela de status), em vez de uma Edge Function de gravação que não é viável no Lovable Cloud?
