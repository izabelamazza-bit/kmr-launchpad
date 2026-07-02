
-- 1) agent_config: restrict writes to admin/supervisor
DROP POLICY IF EXISTS "Authenticated can insert agent_config" ON public.agent_config;
DROP POLICY IF EXISTS "Authenticated can update agent_config" ON public.agent_config;
DROP POLICY IF EXISTS "Authenticated can delete agent_config" ON public.agent_config;

CREATE POLICY "Admins can insert agent_config"
ON public.agent_config FOR INSERT TO authenticated
WITH CHECK (public.is_supervisor_or_admin(auth.uid()));

CREATE POLICY "Admins can update agent_config"
ON public.agent_config FOR UPDATE TO authenticated
USING (public.is_supervisor_or_admin(auth.uid()))
WITH CHECK (public.is_supervisor_or_admin(auth.uid()));

CREATE POLICY "Admins can delete agent_config"
ON public.agent_config FOR DELETE TO authenticated
USING (public.is_supervisor_or_admin(auth.uid()));

-- 2) clear_must_change_password → SECURITY INVOKER (relies on self-update RLS on users_registry)
CREATE OR REPLACE FUNCTION public.clear_must_change_password()
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  UPDATE public.users_registry
     SET must_change_password = false, updated_at = now()
   WHERE user_id = auth.uid();
END;
$function$;

-- 3) ensure_user_role: revoke API access; only callable by service_role / internal
REVOKE ALL ON FUNCTION public.ensure_user_role() FROM PUBLIC, anon, authenticated;
