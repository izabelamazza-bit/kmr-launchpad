import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const tools = [
  {
    type: "function",
    function: {
      name: "save_lead",
      description:
        "Salva os dados do lead qualificado no banco de dados. Use quando tiver coletado nome, email e telefone do visitante.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nome completo do visitante" },
          email: { type: "string", description: "Email do visitante" },
          phone: { type: "string", description: "Telefone com DDD" },
          company: { type: "string", description: "Nome da imobiliária/empresa" },
          interest: { type: "string", description: "O que o cliente busca / necessidade" },
          qualification_notes: {
            type: "string",
            description: "Resumo da qualificação: volume, tipo de imóveis, urgência",
          },
        },
        required: ["name", "email", "phone"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "schedule_meeting",
      description:
        "Agenda uma reunião/demonstração para o lead. Use quando o visitante confirmar um horário.",
      parameters: {
        type: "object",
        properties: {
          lead_id: { type: "string", description: "ID do lead já salvo" },
          scheduled_at: {
            type: "string",
            description: "Data e hora da reunião no formato ISO 8601 (ex: 2026-03-16T10:00:00-03:00)",
          },
        },
        required: ["lead_id", "scheduled_at"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "transfer_to_human",
      description:
        "Transfere o atendimento para um humano. Use quando o visitante pedir para falar com um atendente, quando não souber responder, ou quando a situação exigir intervenção humana.",
      parameters: {
        type: "object",
        properties: {
          lead_id: { type: "string", description: "ID do lead" },
          reason: { type: "string", description: "Motivo da transferência" },
        },
        required: ["reason"],
        additionalProperties: false,
      },
    },
  },
];

async function loadAgentConfig(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase
    .from("agent_config")
    .select("*")
    .limit(1)
    .single();

  if (error || !data) {
    console.error("Error loading agent config:", error);
    return null;
  }
  return data;
}

function buildSystemPrompt(config: Record<string, unknown>): string {
  let prompt = (config.system_prompt as string) || "";

  const personality = config.personality as string;
  if (personality) {
    prompt += `\n\nPERSONALIDADE:\n${personality}`;
  }

  const maxLen = config.max_response_length as number;
  if (maxLen) {
    prompt += `\n\nLIMITE: Mantenha suas respostas em no máximo ${maxLen} caracteres.`;
  }

  const kb = (config.knowledge_base as Array<{ title: string; content: string; category: string }>) || [];
  if (kb.length > 0) {
    prompt += "\n\nBASE DE CONHECIMENTO (use estas informações para responder):";
    for (const item of kb) {
      prompt += `\n\n[${item.category}] ${item.title}:\n${item.content}`;
    }
  }

  const actions = (config.allowed_actions as Array<{ name: string; label: string; enabled: boolean }>) || [];
  const disabledActions = actions.filter((a) => !a.enabled);
  if (disabledActions.length > 0) {
    prompt += `\n\nAÇÕES DESATIVADAS (NÃO use estas tools): ${disabledActions.map((a) => a.name).join(", ")}`;
  }

  const restrictions = (config.restricted_topics as string[]) || [];
  if (restrictions.length > 0) {
    prompt += "\n\nRESTRIÇÕES (NUNCA faça o seguinte):";
    for (const r of restrictions) {
      prompt += `\n- ${r}`;
    }
  }

  return prompt;
}

function getActiveTools(config: Record<string, unknown>) {
  const actions = (config.allowed_actions as Array<{ name: string; label: string; enabled: boolean }>) || [];
  const enabledNames = new Set(actions.filter((a) => a.enabled).map((a) => a.name));
  if (enabledNames.size === 0 && actions.length === 0) return tools;
  return tools.filter((t) => enabledNames.has(t.function.name));
}

async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
  supabase: ReturnType<typeof createClient>,
  conversationHistory: unknown[],
  currentLeadId: string | null
): Promise<{ result: string; leadId?: string }> {
  if (toolName === "save_lead") {
    const { data, error } = await supabase
      .from("leads")
      .insert({
        name: args.name as string,
        email: args.email as string,
        phone: args.phone as string,
        company: (args.company as string) || null,
        interest: (args.interest as string) || null,
        qualification_notes: (args.qualification_notes as string) || null,
        status: "qualificado",
        channel_status: "ai_active",
        conversation_history: conversationHistory,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error saving lead:", error);
      return { result: `Erro ao salvar lead: ${error.message}` };
    }
    return { result: `Lead salvo com sucesso! ID: ${data.id}`, leadId: data.id };
  }

  if (toolName === "schedule_meeting") {
    const leadId = (args.lead_id as string) || currentLeadId;
    const { error } = await supabase
      .from("leads")
      .update({
        scheduled_at: args.scheduled_at as string,
        status: "agendado",
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadId as string);

    if (error) {
      console.error("Error scheduling:", error);
      return { result: `Erro ao agendar: ${error.message}` };
    }
    return { result: "Reunião agendada com sucesso!" };
  }

  if (toolName === "transfer_to_human") {
    const leadId = (args.lead_id as string) || currentLeadId;
    if (!leadId) {
      return { result: "Lead ID não encontrado para transferência." };
    }
    const { error } = await supabase
      .from("leads")
      .update({
        channel_status: "queue",
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadId);

    if (error) {
      console.error("Error transferring:", error);
      return { result: `Erro ao transferir: ${error.message}` };
    }
    return { result: "Atendimento transferido para a fila de atendentes humanos." };
  }

  return { result: "Tool desconhecida" };
}

async function callAI(apiKey: string, body: Record<string, unknown>) {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return resp;
}

function errorResponse(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const rawMessages = Array.isArray(body?.messages) ? body.messages : [];
    const leadId = typeof body?.leadId === "string" ? body.leadId : null;

    // Input validation: only allow user/assistant roles from client, cap counts and lengths.
    const MAX_MESSAGES = 50;
    const MAX_CONTENT_CHARS = 4000;
    const messages = rawMessages
      .filter((m: unknown): m is { role: string; content: unknown } => {
        if (!m || typeof m !== "object") return false;
        const role = (m as { role?: unknown }).role;
        return role === "user" || role === "assistant";
      })
      .slice(-MAX_MESSAGES)
      .map((m) => {
        const content = typeof m.content === "string" ? m.content : "";
        return { role: m.role, content: content.slice(0, MAX_CONTENT_CHARS) };
      });

    if (messages.length === 0) {
      return errorResponse(400, "Nenhuma mensagem válida enviada.");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate leadId: must exist and be in ai_active state.
    let validatedLeadId: string | null = null;
    if (leadId) {
      const { data: leadData } = await supabase
        .from("leads")
        .select("channel_status")
        .eq("id", leadId)
        .single();

      if (!leadData) {
        return errorResponse(404, "Lead não encontrado.");
      }
      if (leadData.channel_status !== "ai_active") {
        return errorResponse(403, "Atendimento assumido por um humano.");
      }
      validatedLeadId = leadId;
    }

    const agentConfig = await loadAgentConfig(supabase);

    if (agentConfig && !agentConfig.is_active) {
      return errorResponse(503, "O assistente está temporariamente indisponível.");
    }

    const systemPrompt = agentConfig ? buildSystemPrompt(agentConfig) : "Você é um assistente virtual.";
    const model = (agentConfig?.model as string) || "google/gemini-3-flash-preview";
    const activeTools = agentConfig ? getActiveTools(agentConfig) : tools;

    const allMessages = [
      { role: "system", content: systemPrompt },
      ...(validatedLeadId
        ? [{ role: "system", content: `O lead atual já está salvo com ID: ${validatedLeadId}. Use este ID para agendar reunião ou transferir.` }]
        : []),
      ...messages,
    ];

    const firstResponse = await callAI(LOVABLE_API_KEY, {
      model,
      messages: allMessages,
      tools: activeTools.length > 0 ? activeTools : undefined,
      stream: false,
    });

    if (!firstResponse.ok) {
      const status = firstResponse.status;
      if (status === 429) return errorResponse(429, "Muitas requisições. Tente novamente em alguns segundos.");
      if (status === 402) return errorResponse(402, "Créditos insuficientes.");
      const t = await firstResponse.text();
      console.error("AI error:", status, t);
      throw new Error("AI gateway error");
    }

    const firstData = await firstResponse.json();
    const choice = firstData.choices?.[0];

    if (choice?.message?.tool_calls?.length > 0) {
      const toolMessages = [...allMessages, choice.message];
      let currentLeadId: string | null = validatedLeadId;

      for (const toolCall of choice.message.tool_calls) {
        const fnName = toolCall.function.name;
        let fnArgs: Record<string, unknown>;
        try { fnArgs = JSON.parse(toolCall.function.arguments); } catch { fnArgs = {}; }

        // Never trust an AI-supplied lead_id — always force the server-validated one.
        if (fnName === "schedule_meeting" || fnName === "transfer_to_human") {
          if (!currentLeadId) {
            toolMessages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: "Lead ainda não foi salvo — chame save_lead antes.",
            });
            continue;
          }
          fnArgs.lead_id = currentLeadId;
        }

        const { result, leadId: newLeadId } = await executeTool(fnName, fnArgs, supabase, messages, currentLeadId);
        if (newLeadId) currentLeadId = newLeadId;

        toolMessages.push({ role: "tool", tool_call_id: toolCall.id, content: result });
      }

      // Also update conversation_history on the lead if we have an ID
      if (currentLeadId) {
        await supabase
          .from("leads")
          .update({ conversation_history: messages, updated_at: new Date().toISOString() })
          .eq("id", currentLeadId);
      }

      const secondResponse = await callAI(LOVABLE_API_KEY, { model, messages: toolMessages, stream: true });

      if (!secondResponse.ok) {
        const t = await secondResponse.text();
        console.error("AI second call error:", secondResponse.status, t);
        throw new Error("AI gateway error on second call");
      }

      const encoder = new TextEncoder();
      const leadIdEvent = currentLeadId
        ? encoder.encode(`data: ${JSON.stringify({ leadId: currentLeadId })}\n\n`)
        : new Uint8Array(0);

      const stream = new ReadableStream({
        async start(controller) {
          controller.enqueue(leadIdEvent);
          const reader = secondResponse.body!.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
          controller.close();
        },
      });

      return new Response(stream, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
    }

    // No tool calls - stream directly
    const streamResponse = await callAI(LOVABLE_API_KEY, { model, messages: allMessages, stream: true });

    if (!streamResponse.ok) {
      const status = streamResponse.status;
      if (status === 429) return errorResponse(429, "Muitas requisições. Tente novamente em alguns segundos.");
      if (status === 402) return errorResponse(402, "Créditos insuficientes.");
      throw new Error("AI gateway stream error");
    }

    return new Response(streamResponse.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    console.error("chat-agent error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
