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

  // Inject knowledge base
  const kb = (config.knowledge_base as Array<{ title: string; content: string; category: string }>) || [];
  if (kb.length > 0) {
    prompt += "\n\nBASE DE CONHECIMENTO (use estas informações para responder):";
    for (const item of kb) {
      prompt += `\n\n[${item.category}] ${item.title}:\n${item.content}`;
    }
  }

  // Inject allowed actions
  const actions = (config.allowed_actions as Array<{ name: string; label: string; enabled: boolean }>) || [];
  const enabledActions = actions.filter((a) => a.enabled);
  const disabledActions = actions.filter((a) => !a.enabled);
  if (disabledActions.length > 0) {
    prompt += `\n\nAÇÕES DESATIVADAS (NÃO use estas tools): ${disabledActions.map((a) => a.name).join(", ")}`;
  }

  // Inject restrictions
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
  // If no config, return all tools
  if (enabledNames.size === 0 && actions.length === 0) return tools;
  return tools.filter((t) => enabledNames.has(t.function.name));
}

async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
  supabase: ReturnType<typeof createClient>,
  conversationHistory: unknown[]
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
    const { error } = await supabase
      .from("leads")
      .update({
        scheduled_at: args.scheduled_at as string,
        status: "agendado",
        updated_at: new Date().toISOString(),
      })
      .eq("id", args.lead_id as string);

    if (error) {
      console.error("Error scheduling:", error);
      return { result: `Erro ao agendar: ${error.message}` };
    }
    return { result: "Reunião agendada com sucesso!" };
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
    const { messages, leadId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Load dynamic config
    const agentConfig = await loadAgentConfig(supabase);

    if (agentConfig && !agentConfig.is_active) {
      return errorResponse(503, "O assistente está temporariamente indisponível.");
    }

    const systemPrompt = agentConfig ? buildSystemPrompt(agentConfig) : "Você é um assistente virtual.";
    const model = (agentConfig?.model as string) || "google/gemini-3-flash-preview";
    const activeTools = agentConfig ? getActiveTools(agentConfig) : tools;

    const allMessages = [
      { role: "system", content: systemPrompt },
      ...(leadId
        ? [{ role: "system", content: `O lead atual já está salvo com ID: ${leadId}. Use este ID para agendar reunião.` }]
        : []),
      ...messages,
    ];

    // First call
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

    // Handle tool calls
    if (choice?.message?.tool_calls?.length > 0) {
      const toolMessages = [...allMessages, choice.message];
      let currentLeadId = leadId;

      for (const toolCall of choice.message.tool_calls) {
        const fnName = toolCall.function.name;
        let fnArgs: Record<string, unknown>;
        try { fnArgs = JSON.parse(toolCall.function.arguments); } catch { fnArgs = {}; }

        if (fnName === "schedule_meeting" && !fnArgs.lead_id && currentLeadId) {
          fnArgs.lead_id = currentLeadId;
        }

        const { result, leadId: newLeadId } = await executeTool(fnName, fnArgs, supabase, messages);
        if (newLeadId) currentLeadId = newLeadId;

        toolMessages.push({ role: "tool", tool_call_id: toolCall.id, content: result });
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
