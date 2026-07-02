import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const PUBLIC_PATHS = ["/", "/login", "/componentes"];

const RequirePasswordChange = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session) {
        if (!cancelled) setChecked(true);
        return;
      }

      let mustChange = Boolean(session.user.user_metadata?.must_change_password);

      if (!mustChange) {
        // Fallback to DB flag
        const { data: reg } = await supabase
          .from("users_registry")
          .select("must_change_password")
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (reg?.must_change_password) mustChange = true;
      }

      const path = location.pathname;
      if (mustChange && path !== "/trocar-senha" && !PUBLIC_PATHS.includes(path)) {
        navigate("/trocar-senha", { replace: true });
      } else if (!mustChange && path === "/trocar-senha") {
        navigate("/dashboard", { replace: true });
      }
      if (!cancelled) setChecked(true);
    };

    check();
    const { data: sub } = supabase.auth.onAuthStateChange(() => check());
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  if (!checked) return null;
  return <>{children}</>;
};

export default RequirePasswordChange;