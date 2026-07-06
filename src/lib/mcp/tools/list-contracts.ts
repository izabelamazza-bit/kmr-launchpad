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
  name: "list_contracts",
  title: "Listar contratos auditados",
  description: "Lista contratos do módulo de Auditoria KMR com filtros opcionais por status e garantidora.",
  inputSchema: {
    audit_status: z.string().optional().describe("Ex.: pendente, aprovado, reprovado."),
    garantidora: z.string().optional(),
    limit: z.number().int().min(1).max(200).default(50),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ audit_status, garantidora, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    let q = sb(ctx).from("audit_contracts")
      .select("id,imoview_number,garantidora,empresa,locatario_nome,locador_nome,endereco_imovel,valor_aluguel,data_inicio,data_fim,audit_status,status_contrato,analyst_name,created_at")
      .order("created_at", { ascending: false }).limit(limit);
    if (audit_status) q = q.eq("audit_status", audit_status);
    if (garantidora) q = q.eq("garantidora", garantidora);
    const { data, error } = await q;
    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { contracts: data ?? [] } };
  },
});