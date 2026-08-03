CREATE TABLE public.guarantor_portal_inadimplencia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id uuid REFERENCES public.guarantor_portal_imports(id) ON DELETE SET NULL,
  contrato text NOT NULL,
  pendencia_id text NOT NULL,
  imob_status text,
  status_codigo text,
  contract_status_codigo text,
  valor numeric,
  valor_atual numeric,
  data_pendencia date,
  criado_em timestamptz,
  data_pagamento date,
  dt_vencimento date,
  forma_pgto_codigo text,
  expiration_days integer,
  details_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  data_importacao timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.guarantor_portal_inadimplencia TO authenticated;
GRANT ALL ON public.guarantor_portal_inadimplencia TO service_role;
ALTER TABLE public.guarantor_portal_inadimplencia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can select inadimplencia" ON public.guarantor_portal_inadimplencia FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert inadimplencia" ON public.guarantor_portal_inadimplencia FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update inadimplencia" ON public.guarantor_portal_inadimplencia FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete inadimplencia" ON public.guarantor_portal_inadimplencia FOR DELETE TO authenticated USING (true);

CREATE UNIQUE INDEX guarantor_portal_inadimplencia_pendencia_id_key ON public.guarantor_portal_inadimplencia(pendencia_id);
CREATE INDEX guarantor_portal_inadimplencia_contrato_idx ON public.guarantor_portal_inadimplencia(contrato);

CREATE TABLE public.guarantor_portal_code_lookup (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campo text NOT NULL,
  codigo text NOT NULL,
  rotulo text,
  UNIQUE (campo, codigo)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.guarantor_portal_code_lookup TO authenticated;
GRANT ALL ON public.guarantor_portal_code_lookup TO service_role;
ALTER TABLE public.guarantor_portal_code_lookup ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can select code lookup" ON public.guarantor_portal_code_lookup FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert code lookup" ON public.guarantor_portal_code_lookup FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update code lookup" ON public.guarantor_portal_code_lookup FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete code lookup" ON public.guarantor_portal_code_lookup FOR DELETE TO authenticated USING (true);

ALTER TABLE public.guarantor_portal_imports
  ADD COLUMN tipo text NOT NULL DEFAULT 'contrato';

UPDATE public.guarantor_portal_imports SET tipo = 'contrato' WHERE tipo IS NULL;

ALTER TABLE public.guarantor_portal_imports
  ADD CONSTRAINT guarantor_portal_imports_tipo_check
  CHECK (tipo IN ('contrato','movimentacao','inadimplencia'));