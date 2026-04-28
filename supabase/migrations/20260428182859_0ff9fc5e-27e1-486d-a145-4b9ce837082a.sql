ALTER TABLE public.sinistros
  ADD COLUMN IF NOT EXISTS possui_obras boolean NOT NULL DEFAULT false;

ALTER TABLE public.sinistros
  ALTER COLUMN status SET DEFAULT 'em_analise';