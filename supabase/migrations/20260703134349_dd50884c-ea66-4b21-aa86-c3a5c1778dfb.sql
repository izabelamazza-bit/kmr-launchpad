DROP POLICY IF EXISTS audit_contracts_delete ON public.audit_contracts;
CREATE POLICY audit_contracts_delete ON public.audit_contracts FOR DELETE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS checklist_delete ON public.audit_checklist_items;
CREATE POLICY checklist_delete ON public.audit_checklist_items FOR DELETE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS extracted_data_delete ON public.audit_contract_extracted_data;
CREATE POLICY extracted_data_delete ON public.audit_contract_extracted_data FOR DELETE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS audit_pdf_delete ON storage.objects;
CREATE POLICY audit_pdf_delete ON storage.objects FOR DELETE USING (bucket_id = 'audit-contracts' AND auth.uid() IS NOT NULL);