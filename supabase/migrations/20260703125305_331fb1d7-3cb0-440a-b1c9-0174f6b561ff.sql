
-- audit_contracts: UPDATE liberado a qualquer autenticado
DROP POLICY IF EXISTS audit_contracts_update ON public.audit_contracts;
CREATE POLICY audit_contracts_update ON public.audit_contracts
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- audit_checklist_items: INSERT/UPDATE liberados a qualquer autenticado (desde que o contrato exista); DELETE apenas supervisor/admin
DROP POLICY IF EXISTS checklist_insert ON public.audit_checklist_items;
DROP POLICY IF EXISTS checklist_update ON public.audit_checklist_items;
DROP POLICY IF EXISTS checklist_delete ON public.audit_checklist_items;

CREATE POLICY checklist_insert ON public.audit_checklist_items
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.audit_contracts c WHERE c.id = contract_id)
  );

CREATE POLICY checklist_update ON public.audit_checklist_items
  FOR UPDATE TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.audit_contracts c WHERE c.id = contract_id)
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.audit_contracts c WHERE c.id = contract_id)
  );

CREATE POLICY checklist_delete ON public.audit_checklist_items
  FOR DELETE TO authenticated
  USING (public.is_supervisor_or_admin(auth.uid()));

-- audit_contract_extracted_data: mesmo padrão
DROP POLICY IF EXISTS extracted_data_insert ON public.audit_contract_extracted_data;
DROP POLICY IF EXISTS extracted_data_update ON public.audit_contract_extracted_data;
DROP POLICY IF EXISTS extracted_data_delete ON public.audit_contract_extracted_data;

CREATE POLICY extracted_data_insert ON public.audit_contract_extracted_data
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.audit_contracts c WHERE c.id = contract_id)
  );

CREATE POLICY extracted_data_update ON public.audit_contract_extracted_data
  FOR UPDATE TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.audit_contracts c WHERE c.id = contract_id)
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.audit_contracts c WHERE c.id = contract_id)
  );

CREATE POLICY extracted_data_delete ON public.audit_contract_extracted_data
  FOR DELETE TO authenticated
  USING (public.is_supervisor_or_admin(auth.uid()));
