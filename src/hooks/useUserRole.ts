import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "supervisor" | "analista";

export function useUserRole() {
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        if (!cancelled) {
          setRole(null);
          setLoading(false);
        }
        return;
      }
      // Ensure role exists (first user becomes admin)
      const { data: ensured } = await supabase.rpc("ensure_user_role" as never);
      let r = (ensured as AppRole | null) ?? null;
      if (!r) {
        const { data: existing } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", sess.session.user.id)
          .maybeSingle();
        r = (existing?.role as AppRole | undefined) ?? "analista";
      }
      if (!cancelled) {
        setRole(r);
        setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const isSupervisorOrAdmin = role === "admin" || role === "supervisor";
  return { role, loading, isSupervisorOrAdmin };
}