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
  name: "get_contract",
  title: "Detalhar contrato",
  description: "Retorna dados completos de um contrato de auditoria KMR pelo id, incluindo checklist e dados extraídos do PDF.",
  inputSchema: { id: z.string().uuid() },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const client = sb(ctx);
    const [c, checklist, extracted] = await Promise.all([
      client.from("audit_contracts").select("*").eq("id", id).maybeSingle(),
      client.from("audit_checklist_items").select("*").eq("contract_id", id),
      client.from("audit_contract_extracted_data").select("*").eq("contract_id", id).maybeSingle(),
    ]);
    if (c.error) return { content: [{ type: "text", text: c.error.message }], isError: true };
    if (!c.data) return { content: [{ type: "text", text: "Contrato não encontrado" }], isError: true };
    const payload = { contract: c.data, checklist: checklist.data ?? [], extracted: extracted.data ?? null };
    return { content: [{ type: "text", text: JSON.stringify(payload) }], structuredContent: payload };
  },
});