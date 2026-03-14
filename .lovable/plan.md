

## Plano: Agente de IA para qualificação e agendamento

### Visão geral

Criar um chatbot flutuante no site (landing page) que usa o Lovable AI Gateway (`google/gemini-3-flash-preview`) para qualificar leads e agendar reuniões. O agente coleta dados do cliente, avalia o perfil e propõe horários para uma reunião com um humano.

### 1. Tabela de banco de dados

**`leads`** — armazena os leads qualificados e agendamentos:
- id (uuid, PK)
- name (text)
- email (text)
- phone (text)
- company (text, nullable)
- interest (text) — o que o cliente busca
- qualification_notes (text) — resumo da qualificação feita pela IA
- scheduled_at (timestamptz, nullable) — data/hora agendada
- status (text, default 'novo') — novo, qualificado, agendado, descartado
- conversation_history (jsonb) — histórico completo do chat
- created_at, updated_at (timestamptz)

RLS: INSERT para anon (o visitante não está autenticado), SELECT/UPDATE/DELETE para authenticated.

### 2. Edge Function `chat-agent`

**`supabase/functions/chat-agent/index.ts`**

- Recebe `{ messages, leadId? }` do frontend
- System prompt instruindo o agente a:
  1. Cumprimentar e perguntar o nome
  2. Perguntar sobre a empresa e necessidade (garantia locatícia)
  3. Coletar email e telefone
  4. Qualificar (tipo de imóvel, volume, urgência)
  5. Propor agendamento de reunião (oferecer datas/horários)
  6. Usar tool calling para salvar o lead e agendar
- Usa streaming SSE via Lovable AI Gateway
- Tools definidas: `save_lead` (salva no banco) e `schedule_meeting` (atualiza com data)
- Quando a IA chama uma tool, a edge function executa a ação no banco e retorna o resultado
- Atualiza `config.toml` com `verify_jwt = false` (visitantes não autenticados)

### 3. Componente de chat flutuante

**`src/components/chat/ChatWidget.tsx`** — Widget flutuante (botão no canto inferior direito):
- Botão circular com ícone de chat
- Ao clicar, abre painel de chat com:
  - Header com título "Assistente KMR"
  - Área de mensagens com scroll, renderizando markdown
  - Input de texto + botão enviar
  - Indicador de "digitando..."
- Streaming token-by-token do SSE
- Visual moderno, integrado ao design system (cores, tipografia, botões)
- Responsivo: em mobile ocupa mais da tela

**`src/components/chat/ChatMessage.tsx`** — Renderiza uma mensagem (user/assistant) com `react-markdown`.

### 4. Integração na landing page

- Adicionar `<ChatWidget />` no `Index.tsx` — aparece flutuando em todas as seções da landing page

### 5. Visualização de leads no Dashboard

- Nova página **`src/pages/cadastros/Leads.tsx`** usando os componentes CRUD existentes (CrudLayout, DataTable, DeleteDialog)
- Listagem de leads com: nome, email, telefone, status, data agendada
- Visualização do histórico de conversa
- Rota `/cadastros/leads` adicionada ao App.tsx
- Card no Dashboard para acessar leads

### Arquivos a criar/editar

```text
Criar:
  supabase/functions/chat-agent/index.ts
  src/components/chat/ChatWidget.tsx
  src/components/chat/ChatMessage.tsx
  src/pages/cadastros/Leads.tsx

Editar:
  src/pages/Index.tsx          (adicionar ChatWidget)
  src/pages/Dashboard.tsx      (adicionar card Leads)
  src/App.tsx                  (rota /cadastros/leads)
  supabase/config.toml         (chat-agent verify_jwt=false)

Migration:
  1 SQL — tabela leads + RLS policies
```

### Fluxo do agente

```text
Visitante abre chat → Agente cumprimenta
→ Pergunta nome, empresa, necessidade
→ Qualifica (tipo imóvel, volume, urgência)
→ Coleta email e telefone
→ Propõe horários para reunião
→ Salva lead + agendamento no banco
→ Confirma ao visitante
```

