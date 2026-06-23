
CREATE POLICY "audit_pdf_read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'audit-contracts');

CREATE POLICY "audit_pdf_insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'audit-contracts');

CREATE POLICY "audit_pdf_update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'audit-contracts')
WITH CHECK (bucket_id = 'audit-contracts');

CREATE POLICY "audit_pdf_delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'audit-contracts' AND public.is_supervisor_or_admin(auth.uid()));
