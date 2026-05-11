
CREATE TABLE public.contratos_pessoas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  nome text NOT NULL,
  telefone1 text NOT NULL,
  telefone2 text,
  email text NOT NULL,
  valor_aluguel numeric(10,2) NOT NULL DEFAULT 0,
  endereco text NOT NULL,
  situacao text NOT NULL DEFAULT 'saudavel',
  data_inicio date NOT NULL,
  data_fim date NOT NULL,
  proximo_reajuste date NOT NULL,
  dia_vencimento integer NOT NULL DEFAULT 10,
  aviso_desocupacao boolean NOT NULL DEFAULT false,
  data_aviso_desocupacao date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contratos_pessoas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can select contratos_pessoas" ON public.contratos_pessoas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert contratos_pessoas" ON public.contratos_pessoas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update contratos_pessoas" ON public.contratos_pessoas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete contratos_pessoas" ON public.contratos_pessoas FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_contratos_pessoas_updated_at
BEFORE UPDATE ON public.contratos_pessoas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
