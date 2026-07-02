
-- audit_contracts: relax SELECT to any authenticated user
DROP POLICY IF EXISTS audit_contracts_select ON public.audit_contracts;
CREATE POLICY audit_contracts_select ON public.audit_contracts
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

-- audit_checklist_items: split ALL into SELECT (open to authenticated) + write (restricted)
DROP POLICY IF EXISTS checklist_all ON public.audit_checklist_items;

CREATE POLICY checklist_select ON public.audit_checklist_items
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY checklist_insert ON public.audit_checklist_items
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.audit_contracts c
    WHERE c.id = audit_checklist_items.contract_id
      AND (public.is_supervisor_or_admin(auth.uid())
           OR c.analyst_id = auth.uid()
           OR c.created_by = auth.uid())
  ));

CREATE POLICY checklist_update ON public.audit_checklist_items
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.audit_contracts c
    WHERE c.id = audit_checklist_items.contract_id
      AND (public.is_supervisor_or_admin(auth.uid())
           OR c.analyst_id = auth.uid()
           OR c.created_by = auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.audit_contracts c
    WHERE c.id = audit_checklist_items.contract_id
      AND (public.is_supervisor_or_admin(auth.uid())
           OR c.analyst_id = auth.uid()
           OR c.created_by = auth.uid())
  ));

CREATE POLICY checklist_delete ON public.audit_checklist_items
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.audit_contracts c
    WHERE c.id = audit_checklist_items.contract_id
      AND (public.is_supervisor_or_admin(auth.uid())
           OR c.analyst_id = auth.uid()
           OR c.created_by = auth.uid())
  ));

-- audit_contract_extracted_data: same pattern
DROP POLICY IF EXISTS extracted_data_all ON public.audit_contract_extracted_data;

CREATE POLICY extracted_data_select ON public.audit_contract_extracted_data
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY extracted_data_insert ON public.audit_contract_extracted_data
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.audit_contracts c
    WHERE c.id = audit_contract_extracted_data.contract_id
      AND (public.is_supervisor_or_admin(auth.uid())
           OR c.analyst_id = auth.uid()
           OR c.created_by = auth.uid())
  ));

CREATE POLICY extracted_data_update ON public.audit_contract_extracted_data
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.audit_contracts c
    WHERE c.id = audit_contract_extracted_data.contract_id
      AND (public.is_supervisor_or_admin(auth.uid())
           OR c.analyst_id = auth.uid()
           OR c.created_by = auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.audit_contracts c
    WHERE c.id = audit_contract_extracted_data.contract_id
      AND (public.is_supervisor_or_admin(auth.uid())
           OR c.analyst_id = auth.uid()
           OR c.created_by = auth.uid())
  ));

CREATE POLICY extracted_data_delete ON public.audit_contract_extracted_data
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.audit_contracts c
    WHERE c.id = audit_contract_extracted_data.contract_id
      AND (public.is_supervisor_or_admin(auth.uid())
           OR c.analyst_id = auth.uid()
           OR c.created_by = auth.uid())
  ));
