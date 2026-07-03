
DROP POLICY IF EXISTS audit_pdf_insert ON storage.objects;
DROP POLICY IF EXISTS audit_pdf_update ON storage.objects;
DROP POLICY IF EXISTS audit_pdf_read ON storage.objects;

CREATE POLICY audit_pdf_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'audit-contracts'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.audit_contracts c
      WHERE c.id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY audit_pdf_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'audit-contracts'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.audit_contracts c
      WHERE c.id::text = (storage.foldername(name))[1]
    )
  )
  WITH CHECK (
    bucket_id = 'audit-contracts'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.audit_contracts c
      WHERE c.id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY audit_pdf_read ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'audit-contracts'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.audit_contracts c
      WHERE c.id::text = (storage.foldername(name))[1]
    )
  );
