import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Não autenticado" }, 401);

    const userClient = createClient(url, anon, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Não autenticado" }, 401);

    const body = await req.json().catch(() => ({}));
    const targetUserId = typeof body?.user_id === "string" ? body.user_id : null;
    const registryId = typeof body?.registry_id === "string" ? body.registry_id : null;

    if (!targetUserId && !registryId) {
      return json({ error: "user_id ou registry_id obrigatório" }, 400);
    }

    const admin = createClient(url, service, { auth: { persistSession: false } });

    if (targetUserId) {
      // Remove roles first (FK dependencies)
      await admin.from("user_roles").delete().eq("user_id", targetUserId);
      await admin.from("users_registry").delete().eq("user_id", targetUserId);

      const { error: delErr } = await admin.auth.admin.deleteUser(targetUserId);
      if (delErr) {
        // If already gone from auth, ignore; otherwise report
        const msg = delErr.message.toLowerCase();
        if (!msg.includes("not found") && !msg.includes("user_not_found")) {
          return json({ error: `Erro ao remover do Auth: ${delErr.message}` }, 400);
        }
      }
    } else if (registryId) {
      await admin.from("users_registry").delete().eq("id", registryId);
    }

    return json({ success: true });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});