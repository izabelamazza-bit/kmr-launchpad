ALTER TABLE public.cobmais_snapshots
  ADD COLUMN IF NOT EXISTS acordo boolean,
  ADD COLUMN IF NOT EXISTS ultimo_evento text,
  ADD COLUMN IF NOT EXISTS ultimo_contato timestamptz;

DROP VIEW IF EXISTS public.cobmais_latest_loft;

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
  s.acordo,
  s.ultimo_evento,
  s.ultimo_contato,
  s.data_snapshot,
  i.data_importacao,
  i.nome_arquivo
FROM public.cobmais_snapshots s
JOIN public.cobmais_imports i ON i.id = s.import_id
WHERE s.garantidora_normalizada = 'Loft'
ORDER BY s.cpf_cnpj, i.data_importacao DESC, s.data_snapshot DESC;