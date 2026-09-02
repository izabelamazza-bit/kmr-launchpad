import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWER = "abcdefghijkmnopqrstuvwxyz";
const DIGITS = "23456789";
const ALL = UPPER + LOWER + DIGITS;

const randomInt = (max: number) => {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] % max;
};

const pick = (set: string) => set[randomInt(set.length)];

/** Senha de 10 caracteres com ao menos 1 maiúscula, 1 minúscula e 1 número. */
const generateTempPassword = () => {
  const chars = [pick(UPPER), pick(LOWER), pick(DIGITS)];
  while (chars.length < 10) chars.push(pick(ALL));
  // Fisher-Yates
  for (let i = chars.length - 1 ; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
};

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
    const { data: caller, error: callerErr } = await userClient.auth.getUser();
    if (callerErr || !caller.user) return json({ error: "Não autenticado" }, 401);

    const body = await req.json().catch(() => ({}));
    const userId = typeof body?.userId === "string" ? body.userId.trim() : "";
    const method = body?.method === "email" ? "email" : body?.method === "show" ? "show" : null;

    if (!userId) return json({ error: "userId é obrigatório" }, 400);
    if (!method) return json({ error: 'method deve ser "show" ou "email"' }, 400);

    const admin = createClient(url, service, { auth: { persistSession: false } });

    const { data: target, error: getErr } = await admin.auth.admin.getUserById(userId);
    if (getErr || !target?.user) {
      return json({ error: "Usuário não encontrado" }, 404);
    }

    const tempPassword = generateTempPassword();

    const { error: updErr } = await admin.auth.admin.updateUserById(userId, {
      password: tempPassword,
      user_metadata: { ...(target.user.user_metadata ?? {}), must_change_password: true },
    });
    if (updErr) {
      return json({ error: `Falha ao redefinir a senha: ${updErr.message}` }, 502);
    }

    // must_change_password já existe em users_registry (usado no primeiro acesso).
    const { error: regErr } = await admin
      .from("users_registry")
      .update({ must_change_password: true, updated_at: new Date().toISOString() })
      .eq("user_id", userId);

    // Log de auditoria — não existe tabela de audit log no projeto.
    // NUNCA registrar a senha temporária aqui.
    console.log(
      JSON.stringify({
        action: "admin-reset-user-password",
        executed_by: caller.user.id,
        target_user_id: userId,
        method,
        timestamp: new Date().toISOString(),
      }),
    );

    const warning = regErr
      ? "Senha redefinida, mas não foi possível marcar a troca obrigatória: o usuário não será forçado a trocar a senha no próximo acesso."
      : undefined;

    if (method === "email") {
      // TODO(próximo prompt): enviar a senha temporária por e-mail para
      // target.user.email usando o serviço de e-mail transacional.
      // A senha NÃO deve ser retornada na resposta neste caso.
      return json({ success: true, ...(warning ? { warning } : {}) });
    }

    return json({ success: true, password: tempPassword, ...(warning ? { warning } : {}) });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
