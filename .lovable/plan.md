

## Plano: Tela de Atendimento com 4 abas

### Visão geral

Criar uma nova página `/atendimento` com 4 abas para acompanhar e gerenciar conversas em tempo real, permitindo que um atendente humano assuma conversas da IA ou atenda transferências.

### 1. Alterações no banco de dados

Adicionar coluna `channel_status` à tabela `leads` para rastrear o estado do atendimento:

```sql
ALTER TABLE leads ADD COLUMN channel_status text NOT NULL DEFAULT 'ai_active';
-- Valores: ai_active, queue, human_active, closed
ALTER TABLE leads ADD COLUMN assigned_to uuid REFERENCES auth.users(id);
```

Habilitar realtime na tabela `leads` para atualizações em tempo real.

### 2. Atualizar Edge Function `chat-agent`

Quando a IA decidir transferir para humano (ex: cliente pede para falar com um humano, ou o agente não sabe responder), usar uma nova tool `transfer_to_human` que atualiza `channel_status = 'queue'`.

Adicionar verificação: se `channel_status != 'ai_active'`, a IA não responde mais (o humano assumiu).

### 3. Nova página `src/pages/Atendimento.tsx`

Layout com header padrão (CrudLayout-style) + 4 abas usando o componente `Tabs`:

**Aba "IA"** — Conversas onde a IA está atendendo (`channel_status = 'ai_active'`):
- Lista de conversas com nome, empresa, última mensagem, tempo
- Botão "Assumir" em cada conversa → muda `channel_status` para `human_active` e `assigned_to` para o usuário logado
- Ao assumir, a IA para de responder e a conversa vai para a aba "Atendimento"

**Aba "Fila"** — Conversas transferidas pela IA (`channel_status = 'queue'`):
- Lista de conversas aguardando atendimento humano
- Botão "Atender" → muda para `human_active`

**Aba "Atendimento"** — Conversas ativas do atendente (`channel_status = 'human_active'`):
- Lista de conversas à esquerda
- Painel de chat à direita com histórico completo e input para responder
- O atendente digita e a mensagem é salva no `conversation_history` do lead
- Botão "Encerrar" → muda para `closed`

**Aba "Encerrado"** — Conversas finalizadas (`channel_status = 'closed'`):
- Lista read-only com histórico para consulta

### 4. Comunicação Chat Humano ↔ Visitante

Para que o visitante receba as mensagens do humano em tempo real, o fluxo será:
- O `ChatWidget` do visitante faz polling ou subscribe via realtime na tabela `leads` para receber atualizações no `conversation_history`
- O atendente insere mensagens no `conversation_history` via update na tabela
- O visitante vê as mensagens novas aparecerem

Alterações no `ChatWidget.tsx`:
- Quando `channel_status != 'ai_active'`, o widget envia mensagens diretamente para a tabela `leads` (update no `conversation_history`) em vez de chamar a edge function
- Subscribe realtime para receber respostas do atendente

### 5. Rotas e Navegação

- Rota `/atendimento` no `App.tsx`
- Card "Atendimento" no `Dashboard.tsx` com ícone `Headset`

### Arquivos

```text
Criar:
  src/pages/Atendimento.tsx

Editar:
  supabase/functions/chat-agent/index.ts  (tool transfer_to_human + check channel_status)
  src/components/chat/ChatWidget.tsx       (realtime + envio direto quando humano assumiu)
  src/App.tsx                              (rota /atendimento)
  src/pages/Dashboard.tsx                  (card Atendimento)

Migration:
  1 SQL — coluna channel_status + assigned_to + realtime
```

