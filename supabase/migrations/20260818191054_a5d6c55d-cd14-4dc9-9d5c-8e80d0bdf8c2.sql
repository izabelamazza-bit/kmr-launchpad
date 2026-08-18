CREATE TABLE public.guarantor_portal_case_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id uuid REFERENCES public.guarantor_portal_imports(id) ON DELETE SET NULL,
  contrato text NOT NULL,
  nota_id text NOT NULL,
  criado_em timestamptz,
  operation_user_name text,
  real_estate_user_name text,
  id_blocklist_valor text,
  descricao text,
  data_importacao timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX guarantor_portal_case_notes_nota_id_key ON public.guarantor_portal_case_notes (nota_id);
CREATE INDEX guarantor_portal_case_notes_contrato_idx ON public.guarantor_portal_case_notes (contrato);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.guarantor_portal_case_notes TO authenticated;
GRANT ALL ON public.guarantor_portal_case_notes TO service_role;

ALTER TABLE public.guarantor_portal_case_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "case_notes_select" ON public.guarantor_portal_case_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "case_notes_insert" ON public.guarantor_portal_case_notes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "case_notes_update" ON public.guarantor_portal_case_notes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "case_notes_delete" ON public.guarantor_portal_case_notes FOR DELETE TO authenticated USING (true);

ALTER TABLE public.guarantor_portal_imports ADD COLUMN origem text NOT NULL DEFAULT 'manual';
ALTER TABLE public.guarantor_portal_imports ADD CONSTRAINT guarantor_portal_imports_origem_check CHECK (origem IN ('manual','rpa','api'));