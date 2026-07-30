CREATE TABLE public.guarantor_portal_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  garantidora text NOT NULL DEFAULT 'Loft',
  nome_arquivo text,
  data_importacao timestamptz NOT NULL DEFAULT now(),
  total_linhas integer,
  importado_por uuid REFERENCES auth.users(id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.guarantor_portal_imports TO authenticated;
GRANT ALL ON public.guarantor_portal_imports TO service_role;

ALTER TABLE public.guarantor_portal_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY guarantor_portal_imports_select ON public.guarantor_portal_imports FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY guarantor_portal_imports_insert ON public.guarantor_portal_imports FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY guarantor_portal_imports_update ON public.guarantor_portal_imports FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY guarantor_portal_imports_delete ON public.guarantor_portal_imports FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE TABLE public.guarantor_portal_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id uuid NOT NULL REFERENCES public.guarantor_portal_imports(id) ON DELETE CASCADE,
  garantidora text NOT NULL DEFAULT 'Loft',
  contrato text NOT NULL,
  valor_locaticio numeric,
  valor_aluguel numeric,
  valor_condominio numeric,
  valor_outras_taxas numeric,
  cancelamento_taxa boolean,
  cancelamento_taxa_previsao date,
  pagamento_suspenso boolean,
  status text,
  valor_setup numeric,
  plano text,
  data_criacao date,
  data_ativacao date,
  data_exoneracao date,
  ultima_renovacao date,
  corretor text,
  inquilino text,
  inquilino_cpf text,
  cep text,
  endereco text,
  endereco_numero text,
  complemento text,
  bairro text,
  cidade text,
  uf text,
  fianca_total numeric,
  garantia numeric,
  multiplicador numeric,
  custo_saida numeric,
  motivo_exoneracao text,
  data_snapshot timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.guarantor_portal_snapshots TO authenticated;
GRANT ALL ON public.guarantor_portal_snapshots TO service_role;

ALTER TABLE public.guarantor_portal_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY guarantor_portal_snapshots_select ON public.guarantor_portal_snapshots FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY guarantor_portal_snapshots_insert ON public.guarantor_portal_snapshots FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY guarantor_portal_snapshots_update ON public.guarantor_portal_snapshots FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY guarantor_portal_snapshots_delete ON public.guarantor_portal_snapshots FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE INDEX idx_guarantor_portal_snapshots_contrato ON public.guarantor_portal_snapshots(contrato);
CREATE INDEX idx_guarantor_portal_snapshots_import_id ON public.guarantor_portal_snapshots(import_id);

CREATE VIEW public.guarantor_portal_movements
WITH (security_invoker = true) AS
WITH base AS (
  SELECT
    s.contrato,
    s.inquilino,
    s.status,
    s.cancelamento_taxa,
    s.pagamento_suspenso,
    s.import_id,
    i.data_importacao,
    LAG(s.status) OVER w AS status_anterior,
    LAG(s.cancelamento_taxa) OVER w AS cancelamento_taxa_anterior,
    LAG(s.pagamento_suspenso) OVER w AS pagamento_suspenso_anterior,
    LAG(s.import_id) OVER w AS import_anterior_id,
    ROW_NUMBER() OVER (PARTITION BY s.contrato ORDER BY i.data_importacao DESC, s.id DESC) AS rn
  FROM public.guarantor_portal_snapshots s
  JOIN public.guarantor_portal_imports i ON i.id = s.import_id
  WINDOW w AS (PARTITION BY s.contrato ORDER BY i.data_importacao, s.id)
)
SELECT
  contrato,
  inquilino,
  status AS status_atual,
  status_anterior,
  cancelamento_taxa AS cancelamento_taxa_atual,
  cancelamento_taxa_anterior,
  pagamento_suspenso AS pagamento_suspenso_atual,
  pagamento_suspenso_anterior,
  import_id AS import_atual_id,
  import_anterior_id,
  data_importacao AS data_importacao_atual
FROM base
WHERE rn = 1;

GRANT SELECT ON public.guarantor_portal_movements TO authenticated;
GRANT ALL ON public.guarantor_portal_movements TO service_role;