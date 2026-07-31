ALTER TABLE public.sinistros ADD COLUMN IF NOT EXISTS empresa text;
UPDATE public.sinistros SET empresa = 'Rotina' WHERE empresa IS NULL;