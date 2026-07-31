CREATE TABLE public.cobmais_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_arquivo text,
  data_importacao timestamptz NOT NULL DEFAULT now(),
  total_linhas integer,
  importado_por uuid REFERENCES auth.users(id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cobmais_imports TO authenticated;
GRANT ALL ON public.cobmais_imports TO service_role;

ALTER TABLE public.cobmais_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY cobmais_imports_select ON public.cobmais_imports FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY cobmais_imports_insert ON public.cobmais_imports FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY cobmais_imports_update ON public.cobmais_imports FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY cobmais_imports_delete ON public.cobmais_imports FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE TABLE public.cobmais_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id uuid NOT NULL REFERENCES public.cobmais_imports(id) ON DELETE CASCADE,
  cpf_cnpj text,
  cliente text,
  credor text,
  contrato text,
  atraso integer,
  produto text,
  garantidora_normalizada text,
  status_cobranca text,
  risco numeric,
  marcador text,
  data_snapshot timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cobmais_snapshots TO authenticated;
GRANT ALL ON public.cobmais_snapshots TO service_role;

ALTER TABLE public.cobmais_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY cobmais_snapshots_select ON public.cobmais_snapshots FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY cobmais_snapshots_insert ON public.cobmais_snapshots FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY cobmais_snapshots_update ON public.cobmais_snapshots FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY cobmais_snapshots_delete ON public.cobmais_snapshots FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE INDEX idx_cobmais_snapshots_cpf_cnpj ON public.cobmais_snapshots (cpf_cnpj);
CREATE INDEX idx_cobmais_snapshots_contrato ON public.cobmais_snapshots (contrato);
CREATE INDEX idx_cobmais_snapshots_import_id ON public.cobmais_snapshots (import_id);

CREATE VIEW public.cobmais_latest_loft
WITH (security_invoker = true) AS
SELECT DISTINCT ON (s.cpf_cnpj)
  s.id,
  s.import_id,
  s.cpf_cnpj,
  s.cliente,
  s.credor,
  s.contrato,
  s.atraso,
  s.produto,
  s.garantidora_normalizada,
  s.status_cobranca,
  s.risco,
  s.marcador,
  s.data_snapshot,
  i.data_importacao,
  i.nome_arquivo
FROM public.cobmais_snapshots s
JOIN public.cobmais_imports i ON i.id = s.import_id
WHERE s.garantidora_normalizada = 'Loft'
ORDER BY s.cpf_cnpj, i.data_importacao DESC, s.data_snapshot DESC;

GRANT SELECT ON public.cobmais_latest_loft TO authenticated;
GRANT ALL ON public.cobmais_latest_loft TO service_role;