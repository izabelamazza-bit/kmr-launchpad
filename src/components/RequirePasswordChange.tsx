import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

const PUBLIC_PATHS = ["/", "/login", "/componentes", "/.lovable/oauth/consent"];

const RequirePasswordChange = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [checked, setChecked] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    // Subscribe once. Supabase fires INITIAL_SESSION immediately with the
    // current session (or null) — avoids awaiting getSession(), which can
    // hang on its internal navigator lock and freeze the whole app.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setSessionReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!sessionReady) return;
    let cancelled = false;

    const run = async () => {
      try {
        if (!session) return;

        let mustChange = Boolean(session.user.user_metadata?.must_change_password);

        try {
          const { data: reg, error } = await supabase
            .from("users_registry")
            .select("must_change_password")
            .eq("user_id", session.user.id)
            .maybeSingle();

          if (!error && reg) {
            mustChange = Boolean(reg.must_change_password);
          }
        } catch {
          // Se o banco estiver indisponível, usa metadata apenas como cache temporário.
        }

        if (cancelled) return;

        const path = location.pathname;
        if (mustChange && path !== "/trocar-senha" && !PUBLIC_PATHS.includes(path)) {
          navigate("/trocar-senha", { replace: true });
        } else if (!mustChange && path === "/trocar-senha") {
          navigate("/dashboard", { replace: true });
        }
      } finally {
        setChecked(true);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [sessionReady, session, location.pathname, navigate]);

  if (!sessionReady || !checked) return null;
  return <>{children}</>;
};

export default RequirePasswordChange;