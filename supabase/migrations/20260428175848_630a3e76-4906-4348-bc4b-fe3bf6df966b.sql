
-- Tabela principal de sinistros
CREATE TABLE public.sinistros (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inquilino_nome text NOT NULL,
  inquilino_cpf text NOT NULL,
  codigo_contrato text NOT NULL,
  status_imovel text NOT NULL CHECK (status_imovel IN ('ocupado','desocupado')),
  motivo_desocupacao text,
  data_entrega_chaves date,
  checklist jsonb NOT NULL DEFAULT '[]'::jsonb,
  observacoes text,
  status text NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','aberto')),
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.sinistros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can select sinistros" ON public.sinistros FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert sinistros" ON public.sinistros FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update sinistros" ON public.sinistros FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete sinistros" ON public.sinistros FOR DELETE TO authenticated USING (true);

-- Débitos do sinistro
CREATE TABLE public.sinistro_debitos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sinistro_id uuid NOT NULL REFERENCES public.sinistros(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('aluguel','consumo')),
  descricao text,
  data_vencimento date NOT NULL,
  valor numeric(12,2) NOT NULL DEFAULT 0,
  boleto_path text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_sinistro_debitos_sinistro_id ON public.sinistro_debitos(sinistro_id);

ALTER TABLE public.sinistro_debitos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can select sinistro_debitos" ON public.sinistro_debitos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert sinistro_debitos" ON public.sinistro_debitos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update sinistro_debitos" ON public.sinistro_debitos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete sinistro_debitos" ON public.sinistro_debitos FOR DELETE TO authenticated USING (true);

-- Anexos do checklist
CREATE TABLE public.sinistro_anexos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sinistro_id uuid NOT NULL REFERENCES public.sinistros(id) ON DELETE CASCADE,
  nome text NOT NULL,
  tipo text,
  file_path text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_sinistro_anexos_sinistro_id ON public.sinistro_anexos(sinistro_id);

ALTER TABLE public.sinistro_anexos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can select sinistro_anexos" ON public.sinistro_anexos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert sinistro_anexos" ON public.sinistro_anexos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update sinistro_anexos" ON public.sinistro_anexos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete sinistro_anexos" ON public.sinistro_anexos FOR DELETE TO authenticated USING (true);

-- Função de atualização do updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_sinistros_updated_at
BEFORE UPDATE ON public.sinistros
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Bucket de storage (privado)
INSERT INTO storage.buckets (id, name, public) VALUES ('sinistros', 'sinistros', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated can read sinistros files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'sinistros');
CREATE POLICY "Authenticated can upload sinistros files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'sinistros');
CREATE POLICY "Authenticated can update sinistros files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'sinistros') WITH CHECK (bucket_id = 'sinistros');
CREATE POLICY "Authenticated can delete sinistros files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'sinistros');
