-- 1. Coluna empresa (texto livre, mesmo padrão de audit_contracts.empresa)
ALTER TABLE public.guarantor_portal_imports        ADD COLUMN IF NOT EXISTS empresa text NOT NULL DEFAULT 'Rotina';
ALTER TABLE public.guarantor_portal_snapshots      ADD COLUMN IF NOT EXISTS empresa text NOT NULL DEFAULT 'Rotina';
ALTER TABLE public.guarantor_portal_inadimplencia  ADD COLUMN IF NOT EXISTS empresa text NOT NULL DEFAULT 'Rotina';
ALTER TABLE public.guarantor_portal_case_notes     ADD COLUMN IF NOT EXISTS empresa text NOT NULL DEFAULT 'Rotina';
ALTER TABLE public.cobmais_imports                 ADD COLUMN IF NOT EXISTS empresa text NOT NULL DEFAULT 'Rotina';
ALTER TABLE public.cobmais_snapshots               ADD COLUMN IF NOT EXISTS empresa text NOT NULL DEFAULT 'Rotina';

-- 2. Índices para os filtros por empresa
CREATE INDEX IF NOT EXISTS idx_gpi_empresa_tipo   ON public.guarantor_portal_imports (empresa, tipo, data_importacao DESC);
CREATE INDEX IF NOT EXISTS idx_gps_empresa        ON public.guarantor_portal_snapshots (empresa, contrato);
CREATE INDEX IF NOT EXISTS idx_gpinad_empresa     ON public.guarantor_portal_inadimplencia (empresa, contrato);
CREATE INDEX IF NOT EXISTS idx_gpcn_empresa       ON public.guarantor_portal_case_notes (empresa, contrato);
CREATE INDEX IF NOT EXISTS idx_ci_empresa         ON public.cobmais_imports (empresa, data_importacao DESC);
CREATE INDEX IF NOT EXISTS idx_cs_empresa         ON public.cobmais_snapshots (empresa, cpf_cnpj);

-- 3. Views passam a considerar a empresa (coluna nova adicionada ao final)
CREATE OR REPLACE VIEW public.cobmais_latest_loft
WITH (security_invoker = true) AS
  SELECT DISTINCT ON (s.empresa, s.cpf_cnpj)
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
    s.acordo,
    s.ultimo_evento,
    s.ultimo_contato,
    s.data_snapshot,
    i.data_importacao,
    i.nome_arquivo,
    s.empresa
  FROM public.cobmais_snapshots s
  JOIN public.cobmais_imports i ON i.id = s.import_id
  WHERE s.garantidora_normalizada = 'Loft'::text
  ORDER BY s.empresa, s.cpf_cnpj, i.data_importacao DESC, s.data_snapshot DESC;

CREATE OR REPLACE VIEW public.guarantor_portal_movements
WITH (security_invoker = true) AS
  WITH base AS (
    SELECT s.contrato,
      s.inquilino,
      s.status,
      s.cancelamento_taxa,
      s.pagamento_suspenso,
      s.import_id,
      s.empresa,
      i.data_importacao,
      lag(s.status) OVER w AS status_anterior,
      lag(s.cancelamento_taxa) OVER w AS cancelamento_taxa_anterior,
      lag(s.pagamento_suspenso) OVER w AS pagamento_suspenso_anterior,
      lag(s.import_id) OVER w AS import_anterior_id,
      row_number() OVER (PARTITION BY s.empresa, s.contrato ORDER BY i.data_importacao DESC, s.id DESC) AS rn
    FROM public.guarantor_portal_snapshots s
    JOIN public.guarantor_portal_imports i ON i.id = s.import_id
    WINDOW w AS (PARTITION BY s.empresa, s.contrato ORDER BY i.data_importacao, s.id)
  )
  SELECT contrato,
    inquilino,
    status AS status_atual,
    status_anterior,
    cancelamento_taxa AS cancelamento_taxa_atual,
    cancelamento_taxa_anterior,
    pagamento_suspenso AS pagamento_suspenso_atual,
    pagamento_suspenso_anterior,
    import_id AS import_atual_id,
    import_anterior_id,
    data_importacao AS data_importacao_atual,
    empresa
  FROM base
  WHERE rn = 1;