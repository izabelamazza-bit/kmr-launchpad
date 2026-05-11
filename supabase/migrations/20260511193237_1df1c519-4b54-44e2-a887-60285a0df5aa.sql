
CREATE TABLE public.sinistro_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sinistro_id UUID NOT NULL,
  user_id UUID,
  user_name TEXT,
  texto TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sinistro_historico_sinistro_id ON public.sinistro_historico(sinistro_id);

ALTER TABLE public.sinistro_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can select sinistro_historico"
  ON public.sinistro_historico FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert sinistro_historico"
  ON public.sinistro_historico FOR INSERT TO authenticated WITH CHECK (true);
