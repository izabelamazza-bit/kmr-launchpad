

## Plano: Tela de Gestão do Agente de IA

Criar uma página completa de configuração e treinamento do agente, onde o administrador pode editar o prompt, gerenciar a base de conhecimento (RAG), definir capacidades e restrições, e visualizar métricas.

### 1. Tabela `agent_config` (migration)

Armazena configurações dinâmicas do agente que a edge function lê em tempo real:

- **id** (uuid, PK)
- **system_prompt** (text) — prompt de sistema editável
- **knowledge_base** (jsonb, default '[]') — array de documentos/trechos de conhecimento `[{title, content, category}]`
- **allowed_actions** (jsonb) — lista do que o agente PODE fazer (ex: salvar lead, agendar reunião)
- **restricted_topics** (jsonb) — lista do que o agente NÃO pode fazer/falar
- **personality** (text) — descrição da personalidade
- **greeting_message** (text) — mensagem inicial customizável
- **max_response_length** (int, default 500) — limite de caracteres por resposta
- **model** (text, default 'google/gemini-3-flash-preview')
- **is_active** (boolean, default true) — liga/desliga o agente
- **updated_at** (timestamptz)

RLS: SELECT/UPDATE/INSERT/DELETE para authenticated.

Inserir um registro inicial com os valores atuais do system prompt hardcoded.

### 2. Página `src/pages/AgentConfig.tsx`

Tela com abas (Tabs) organizada em seções:

**Aba "Prompt & Personalidade"**
- Textarea grande para editar o system prompt completo
- Campo de personalidade (tom, estilo)
- Campo de mensagem de saudação
- Limite de caracteres por resposta (slider/input)
- Select do modelo de IA

**Aba "Base de Conhecimento"**
- Lista de documentos/trechos adicionados (título, categoria, preview do conteúdo)
- Botão "Adicionar conhecimento" abre modal com: título, categoria (select), conteúdo (textarea grande)
- Editar/excluir cada item
- Explicação: "Adicione informações sobre seus produtos, preços, políticas e FAQ. O agente usará esses dados para responder seus clientes."

**Aba "Capacidades & Restrições"**
- Seção "O que o agente PODE fazer" — lista editável de capacidades com toggle on/off (salvar lead, agendar reunião, responder dúvidas)
- Seção "O que o agente NÃO pode fazer" — lista editável de restrições (ex: não dar desconto, não falar de concorrentes, não inventar informações)
- Botão para adicionar novas regras

**Aba "Status & Métricas"**
- Toggle ativo/inativo do agente
- Contadores: total de leads, leads qualificados, reuniões agendadas (lidos da tabela leads)
- Últimas 5 conversas recentes (preview)

### 3. Atualizar Edge Function `chat-agent`

Modificar para ler `agent_config` do banco em vez do prompt hardcoded:
- Buscar configuração ativa da tabela `agent_config`
- Montar system prompt dinamicamente: prompt base + knowledge base (injetada como contexto) + regras de capacidades/restrições
- Usar mensagem de saudação configurada
- Respeitar flag `is_active`

### 4. Rotas e Navegação

- Rota `/agente` no App.tsx
- Card "Agente de IA" no Dashboard com ícone Bot
- Protegida por autenticação (mesmo padrão do CrudLayout)

### Arquivos

```text
Criar:
  src/pages/AgentConfig.tsx
  supabase migration (tabela agent_config + seed)

Editar:
  supabase/functions/chat-agent/index.ts (ler config do banco)
  src/App.tsx (rota /agente)
  src/pages/Dashboard.tsx (card no menu)
```

