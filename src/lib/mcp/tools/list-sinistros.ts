import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function sb(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_sinistros",
  title: "Listar sinistros",
  description: "Lista sinistros (avisos de desocupação) KMR com filtro opcional por status.",
  inputSchema: {
    status: z.string().optional(),
    empresa: z.string().optional(),
    limit: z.number().int().min(1).max(200).default(50),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, empresa, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    let q = sb(ctx).from("sinistros")
      .select("id,inquilino_nome,inquilino_cpf,codigo_contrato,status_imovel,motivo_desocupacao,data_entrega_chaves,status,empresa,created_at")
      .order("created_at", { ascending: false }).limit(limit);
    if (status) q = q.eq("status", status);
    if (empresa) q = q.eq("empresa", empresa);
    const { data, error } = await q;
    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { sinistros: data ?? [] } };
  },
});