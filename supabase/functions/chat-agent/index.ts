import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o assistente virtual da KMR, uma empresa especializada em garantia locatícia para aluguel.

Seu papel é qualificar leads (potenciais clientes) e agendar reuniões com o time comercial.

PERSONALIDADE:
- Amigável, profissional e direto
- Sem juridiquês — linguagem simples e clara
- Transmita segurança e confiança

FLUXO DA CONVERSA:
1. Cumprimente o visitante e pergunte o nome dele
2. Pergunte o nome da imobiliária/empresa
3. Pergunte qual a necessidade (garantia locatícia, volume de contratos, tipo de imóveis)
4. Colete email e telefone (com DDD)
5. Qualifique: pergunte sobre volume mensal de contratos, tipos de imóveis (residencial/comercial), e urgência
6. Proponha agendar uma reunião/demonstração com o time KMR — ofereça datas próximas (dias úteis, horários comerciais 9h-18h)
7. Quando tiver nome, email, telefone e interesse, use a tool save_lead para salvar
8. Quando o cliente confirmar um horário, use a tool schedule_meeting para agendar

REGRAS:
- Sempre colete pelo menos nome, email e telefone antes de salvar
- Seja conciso nas respostas (máximo 3-4 frases por mensagem)
- Se o visitante não for do segmento imobiliário, seja educado mas explique que a KMR atende imobiliárias
- Sempre direcione para o agendamento de demonstração
- Use markdown para formatação quando necessário
- Responda SEMPRE em português brasileiro

BENEFÍCIOS DA KMR (use quando relevante):
- Regras claras e sem interpretações ambíguas
- Processo simples e sem burocracia
- Agilidade na aprovação
- Transparência total`;

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
    return {
      result: `Lead salvo com sucesso! ID: ${data.id}`,
      leadId: data.id,
    };
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

    // Build messages with system prompt
    const allMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...(leadId
        ? [{ role: "system", content: `O lead atual já está salvo com ID: ${leadId}. Use este ID para agendar reunião.` }]
        : []),
      ...messages,
    ];

    // First call - may trigger tool use
    const firstResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: allMessages,
        tools,
        stream: false,
      }),
    });

    if (!firstResponse.ok) {
      const status = firstResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await firstResponse.text();
      console.error("AI error:", status, t);
      throw new Error("AI gateway error");
    }

    const firstData = await firstResponse.json();
    const choice = firstData.choices?.[0];

    // Check for tool calls
    if (choice?.message?.tool_calls?.length > 0) {
      const toolMessages = [...allMessages, choice.message];
      let currentLeadId = leadId;

      for (const toolCall of choice.message.tool_calls) {
        const fnName = toolCall.function.name;
        let fnArgs: Record<string, unknown>;
        try {
          fnArgs = JSON.parse(toolCall.function.arguments);
        } catch {
          fnArgs = {};
        }

        // If scheduling and we have a leadId from this session, inject it
        if (fnName === "schedule_meeting" && !fnArgs.lead_id && currentLeadId) {
          fnArgs.lead_id = currentLeadId;
        }

        const { result, leadId: newLeadId } = await executeTool(fnName, fnArgs, supabase, messages);
        if (newLeadId) currentLeadId = newLeadId;

        toolMessages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: result,
        });
      }

      // Second call with tool results - stream this one
      const secondResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: toolMessages,
          stream: true,
        }),
      });

      if (!secondResponse.ok) {
        const t = await secondResponse.text();
        console.error("AI second call error:", secondResponse.status, t);
        throw new Error("AI gateway error on second call");
      }

      // Prepend leadId info as a custom SSE event
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

      return new Response(stream, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // No tool calls - stream directly
    const streamResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: allMessages,
        stream: true,
      }),
    });

    if (!streamResponse.ok) {
      const status = streamResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway stream error");
    }

    return new Response(streamResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat-agent error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
