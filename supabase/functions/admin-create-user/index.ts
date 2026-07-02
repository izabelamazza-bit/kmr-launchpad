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

    const admin = createClient(url, service, { auth: { persistSession: false } });

    // Only admin/supervisor can create users
    const { data: allowed } = await admin.rpc("is_supervisor_or_admin", {
      _user_id: userData.user.id,
    });
    if (!allowed) return json({ error: "Sem permissão" }, 403);

    const body = await req.json();
    const full_name = String(body.full_name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const access_profile = String(body.access_profile ?? "analista").toLowerCase();

    if (!full_name) return json({ error: "Nome completo é obrigatório" }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "E-mail inválido" }, 400);
    if (password.length < 8) return json({ error: "Senha deve ter no mínimo 8 caracteres" }, 400);
    if (!["analista", "supervisor"].includes(access_profile))
      return json({ error: "Perfil inválido" }, 400);

    // Create auth user
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, must_change_password: true },
    });
    if (createErr || !created.user) {
      const msg = createErr?.message ?? "Erro ao criar usuário";
      const isDup = msg.toLowerCase().includes("already") || msg.toLowerCase().includes("registered");
      return json({ error: isDup ? "Este e-mail já está cadastrado" : msg }, 400);
    }

    const newUserId = created.user.id;

    // users_registry entry
    const username = email.split("@")[0].slice(0, 40);
    const { error: regErr } = await admin.from("users_registry").insert({
      user_id: newUserId,
      full_name,
      username,
      email,
      access_profile,
      status: "ativo",
      must_change_password: true,
    });
    if (regErr) {
      await admin.auth.admin.deleteUser(newUserId);
      return json({ error: `Erro ao registrar usuário: ${regErr.message}` }, 400);
    }

    // Role
    const { error: roleErr } = await admin.from("user_roles").insert({
      user_id: newUserId,
      role: access_profile, // 'analista' | 'supervisor'
    });
    if (roleErr) {
      return json({ error: `Usuário criado, mas falhou ao atribuir perfil: ${roleErr.message}` }, 400);
    }

    return json({ success: true, user_id: newUserId });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});