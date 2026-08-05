ALTER TABLE public.sinistro_debitos
  ADD COLUMN IF NOT EXISTS valor_multa numeric,
  ADD COLUMN IF NOT EXISTS valor_juros numeric,
  ADD COLUMN IF NOT EXISTS valor_total numeric,
  ADD COLUMN IF NOT EXISTS dias_atraso integer;