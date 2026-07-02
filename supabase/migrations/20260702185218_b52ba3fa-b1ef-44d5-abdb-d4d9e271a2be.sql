
-- 1) LEADS: remove anon SELECT/UPDATE
DROP POLICY IF EXISTS "Anon can select leads" ON public.leads;
DROP POLICY IF EXISTS "Anon can update leads" ON public.leads;

-- 2) USERS_REGISTRY: restrict writes to admin/supervisor; allow self-update
DROP POLICY IF EXISTS "Authenticated users can insert users_registry" ON public.users_registry;
DROP POLICY IF EXISTS "Authenticated users can update users_registry" ON public.users_registry;
DROP POLICY IF EXISTS "Authenticated users can delete users_registry" ON public.users_registry;

CREATE POLICY "Admins can insert users_registry"
ON public.users_registry FOR INSERT TO authenticated
WITH CHECK (public.is_supervisor_or_admin(auth.uid()));

CREATE POLICY "Admins or self can update users_registry"
ON public.users_registry FOR UPDATE TO authenticated
USING (public.is_supervisor_or_admin(auth.uid()) OR user_id = auth.uid())
WITH CHECK (public.is_supervisor_or_admin(auth.uid()) OR user_id = auth.uid());

CREATE POLICY "Admins can delete users_registry"
ON public.users_registry FOR DELETE TO authenticated
USING (public.is_supervisor_or_admin(auth.uid()));

-- 3) STORAGE: sinistros bucket — ownership via first path segment = sinistro id
DROP POLICY IF EXISTS "Authenticated can read sinistros files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update sinistros files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete sinistros files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload sinistros files" ON storage.objects;

CREATE POLICY "Sinistros files: read owner or admin"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'sinistros'
  AND EXISTS (
    SELECT 1 FROM public.sinistros s
    WHERE s.id::text = (storage.foldername(name))[1]
      AND (s.created_by = auth.uid() OR public.is_supervisor_or_admin(auth.uid()))
  )
);

CREATE POLICY "Sinistros files: insert owner or admin"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'sinistros'
  AND EXISTS (
    SELECT 1 FROM public.sinistros s
    WHERE s.id::text = (storage.foldername(name))[1]
      AND (s.created_by = auth.uid() OR public.is_supervisor_or_admin(auth.uid()))
  )
);

CREATE POLICY "Sinistros files: update owner or admin"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'sinistros'
  AND EXISTS (
    SELECT 1 FROM public.sinistros s
    WHERE s.id::text = (storage.foldername(name))[1]
      AND (s.created_by = auth.uid() OR public.is_supervisor_or_admin(auth.uid()))
  )
)
WITH CHECK (
  bucket_id = 'sinistros'
  AND EXISTS (
    SELECT 1 FROM public.sinistros s
    WHERE s.id::text = (storage.foldername(name))[1]
      AND (s.created_by = auth.uid() OR public.is_supervisor_or_admin(auth.uid()))
  )
);

CREATE POLICY "Sinistros files: delete owner or admin"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'sinistros'
  AND EXISTS (
    SELECT 1 FROM public.sinistros s
    WHERE s.id::text = (storage.foldername(name))[1]
      AND (s.created_by = auth.uid() OR public.is_supervisor_or_admin(auth.uid()))
  )
);

-- 4) STORAGE: audit-contracts bucket — ownership via first path segment = contract id
DROP POLICY IF EXISTS "audit_pdf_read" ON storage.objects;
DROP POLICY IF EXISTS "audit_pdf_update" ON storage.objects;
DROP POLICY IF EXISTS "audit_pdf_insert" ON storage.objects;
DROP POLICY IF EXISTS "audit_pdf_delete" ON storage.objects;

CREATE POLICY "audit_pdf_read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'audit-contracts'
  AND EXISTS (
    SELECT 1 FROM public.audit_contracts c
    WHERE c.id::text = (storage.foldername(name))[1]
      AND (c.analyst_id = auth.uid() OR c.created_by = auth.uid() OR public.is_supervisor_or_admin(auth.uid()))
  )
);

CREATE POLICY "audit_pdf_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'audit-contracts'
  AND EXISTS (
    SELECT 1 FROM public.audit_contracts c
    WHERE c.id::text = (storage.foldername(name))[1]
      AND (c.analyst_id = auth.uid() OR c.created_by = auth.uid() OR public.is_supervisor_or_admin(auth.uid()))
  )
);

CREATE POLICY "audit_pdf_update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'audit-contracts'
  AND EXISTS (
    SELECT 1 FROM public.audit_contracts c
    WHERE c.id::text = (storage.foldername(name))[1]
      AND (c.analyst_id = auth.uid() OR c.created_by = auth.uid() OR public.is_supervisor_or_admin(auth.uid()))
  )
)
WITH CHECK (
  bucket_id = 'audit-contracts'
  AND EXISTS (
    SELECT 1 FROM public.audit_contracts c
    WHERE c.id::text = (storage.foldername(name))[1]
      AND (c.analyst_id = auth.uid() OR c.created_by = auth.uid() OR public.is_supervisor_or_admin(auth.uid()))
  )
);

CREATE POLICY "audit_pdf_delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'audit-contracts'
  AND public.is_supervisor_or_admin(auth.uid())
);

-- 5) SECURITY DEFINER functions: revoke direct API execution where not needed
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_supervisor_or_admin(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.seed_audit_checklist() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.recalc_audit_status() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ensure_user_role() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.clear_must_change_password() FROM PUBLIC, anon;
-- Keep authenticated EXECUTE for user-callable helpers:
GRANT EXECUTE ON FUNCTION public.ensure_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_must_change_password() TO authenticated;
