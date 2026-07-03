
-- agent_config: qualquer autenticado
DROP POLICY IF EXISTS "Admins can delete agent_config" ON public.agent_config;
DROP POLICY IF EXISTS "Admins can insert agent_config" ON public.agent_config;
DROP POLICY IF EXISTS "Admins can update agent_config" ON public.agent_config;
CREATE POLICY "Authenticated can delete agent_config" ON public.agent_config
  FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can insert agent_config" ON public.agent_config
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can update agent_config" ON public.agent_config
  FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- users_registry
DROP POLICY IF EXISTS "Admins can delete users_registry" ON public.users_registry;
DROP POLICY IF EXISTS "Admins can insert users_registry" ON public.users_registry;
DROP POLICY IF EXISTS "Admins or self can update users_registry" ON public.users_registry;
CREATE POLICY "Authenticated can delete users_registry" ON public.users_registry
  FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can insert users_registry" ON public.users_registry
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can update users_registry" ON public.users_registry
  FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- user_roles: qualquer autenticado pode ler
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Authenticated can view user_roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- audit_contracts_insert: sem forçar created_by
DROP POLICY IF EXISTS "audit_contracts_insert" ON public.audit_contracts;
CREATE POLICY "audit_contracts_insert" ON public.audit_contracts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- Storage: bucket sinistros — qualquer autenticado
DROP POLICY IF EXISTS "Sinistros files: delete owner or admin" ON storage.objects;
DROP POLICY IF EXISTS "Sinistros files: insert owner or admin" ON storage.objects;
DROP POLICY IF EXISTS "Sinistros files: read owner or admin" ON storage.objects;
DROP POLICY IF EXISTS "Sinistros files: update owner or admin" ON storage.objects;
CREATE POLICY "sinistros_select" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'sinistros' AND auth.uid() IS NOT NULL);
CREATE POLICY "sinistros_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'sinistros' AND auth.uid() IS NOT NULL);
CREATE POLICY "sinistros_update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'sinistros' AND auth.uid() IS NOT NULL) WITH CHECK (bucket_id = 'sinistros' AND auth.uid() IS NOT NULL);
CREATE POLICY "sinistros_delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'sinistros' AND auth.uid() IS NOT NULL);
