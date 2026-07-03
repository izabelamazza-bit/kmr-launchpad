import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "supervisor" | "analista";

export function useUserRole() {
  // Roles foram removidos: qualquer usuário autenticado tem acesso total.
  // Hook mantido por compatibilidade com telas que ainda o importam.
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setAuthed(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setAuthed(!!s);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return {
    role: (authed ? "admin" : null) as AppRole | null,
    loading: authed === null,
    isSupervisorOrAdmin: !!authed,
  };
}