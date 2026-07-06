import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import logoKMR from "@/assets/Logo_KMR.png";

// Supabase's auth.oauth namespace is beta — narrow typed shim.
type OAuthClient = { name?: string; client_name?: string; logo_uri?: string };
type OAuthDetails = { client?: OAuthClient; redirect_url?: string; redirect_to?: string; scopes?: string[] };
const oauth = (supabase.auth as unknown as {
  oauth: {
    getAuthorizationDetails: (id: string) => Promise<{ data: OAuthDetails | null; error: { message: string } | null }>;
    approveAuthorization: (id: string) => Promise<{ data: OAuthDetails | null; error: { message: string } | null }>;
    denyAuthorization: (id: string) => Promise<{ data: OAuthDetails | null; error: { message: string } | null }>;
  };
}).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<OAuthDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) return setError("authorization_id ausente");
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/login?next=" + encodeURIComponent(next);
        return;
      }
      const { data, error } = await oauth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) return setError(error.message);
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) { window.location.href = immediate; return; }
      setDetails(data);
    })();
    return () => { active = false; };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    const { data, error } = approve
      ? await oauth.approveAuthorization(authorizationId)
      : await oauth.denyAuthorization(authorizationId);
    if (error) { setBusy(false); return setError(error.message); }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) { setBusy(false); return setError("Servidor de autorização não retornou redirect."); }
    window.location.href = target;
  }

  const clientName = details?.client?.client_name ?? details?.client?.name ?? "esse aplicativo";

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center space-y-3">
          <img src={logoKMR} alt="KMR" className="h-10 w-auto" />
          <div>
            <CardTitle className="text-2xl">Conectar {clientName} à KMR</CardTitle>
            <CardDescription className="mt-1">
              Este app poderá agir em seu nome, respeitando suas permissões na plataforma.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!error && !details && <p className="text-sm text-muted-foreground text-center">Carregando…</p>}
          {details && (
            <div className="flex flex-col gap-2">
              <Button onClick={() => decide(true)} disabled={busy} className="w-full">Aprovar</Button>
              <Button onClick={() => decide(false)} disabled={busy} variant="outline" className="w-full">Recusar</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}