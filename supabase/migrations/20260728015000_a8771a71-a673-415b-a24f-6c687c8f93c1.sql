CREATE TABLE public.ideali_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_contrato text NOT NULL UNIQUE,
  codigo_legado text,
  produto text,
  status text NOT NULL,
  pontualizado text,
  cep text,
  rua text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  data_inicio_contrato date,
  meses_duracao_contrato integer,
  data_finalizacao_contrato date,
  dia_vencimento integer,
  finalidade_contrato text,
  valor_aluguel numeric(12,2),
  nome_indice text,
  data_ultimo_reajuste date,
  data_proximo_reajuste date,
  taxa_admin numeric(6,2),
  taxa_admin_parc_up numeric(6,2),
  taxa_admin_minima numeric(6,2),
  multa_atraso numeric(6,2),
  juros_atraso_dia numeric(6,2),
  desconto_pontualidade numeric(6,2),
  tipo_garantia text,
  garantidora text,
  despesa_bancaria numeric(10,2),
  taxa_boleto numeric(6,2),
  taxa_ted numeric(6,2),
  gerar_notas_fiscais boolean,
  nome_inquilino text,
  documento_inquilino text,
  telefone_inquilino text,
  emails_inquilino text,
  nome_proprietario text,
  documento_proprietario text,
  telefone_proprietario text,
  emails_proprietario text,
  repasse_proprietario_percentual numeric(5,2),
  empresa text NOT NULL DEFAULT 'Ideali',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ideali_contracts TO authenticated;
GRANT ALL ON public.ideali_contracts TO service_role;

ALTER TABLE public.ideali_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ideali_contracts_select" ON public.ideali_contracts FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "ideali_contracts_insert" ON public.ideali_contracts FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "ideali_contracts_update" ON public.ideali_contracts FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "ideali_contracts_delete" ON public.ideali_contracts FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE INDEX idx_ideali_contracts_status ON public.ideali_contracts(status);
CREATE INDEX idx_ideali_contracts_garantidora ON public.ideali_contracts(garantidora);
CREATE INDEX idx_ideali_contracts_empresa ON public.ideali_contracts(empresa);

CREATE TRIGGER update_ideali_contracts_updated_at
BEFORE UPDATE ON public.ideali_contracts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.ideali_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_contrato text NOT NULL REFERENCES public.ideali_contracts(codigo_contrato) ON DELETE CASCADE,
  id_fatura_origem bigint NOT NULL UNIQUE,
  vencimento_fatura date NOT NULL,
  pagamento_fatura date,
  status_repasse_fatura text,
  data_repasse_fatura date,
  valor_boleto numeric(12,2),
  valor_pago_fatura numeric(12,2),
  status_fatura text NOT NULL,
  adicional_fatura text,
  dado_incompleto boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ideali_invoices TO authenticated;
GRANT ALL ON public.ideali_invoices TO service_role;

ALTER TABLE public.ideali_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ideali_invoices_select" ON public.ideali_invoices FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "ideali_invoices_insert" ON public.ideali_invoices FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "ideali_invoices_update" ON public.ideali_invoices FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "ideali_invoices_delete" ON public.ideali_invoices FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE INDEX idx_ideali_invoices_codigo_contrato ON public.ideali_invoices(codigo_contrato);
CREATE INDEX idx_ideali_invoices_status ON public.ideali_invoices(status_fatura);
CREATE INDEX idx_ideali_invoices_vencimento ON public.ideali_invoices(vencimento_fatura);