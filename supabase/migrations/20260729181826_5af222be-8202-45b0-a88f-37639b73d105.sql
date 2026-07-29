CREATE TABLE public.ideali_documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_contrato text NOT NULL UNIQUE,
  contrato_locacao boolean NOT NULL DEFAULT false,
  vistoria boolean NOT NULL DEFAULT false,
  contrato_adm boolean NOT NULL DEFAULT false,
  relatorio_repasse_cobranca boolean NOT NULL DEFAULT false,
  apolice_garantia boolean NOT NULL DEFAULT false,
  apolice_seguro_incendio boolean NOT NULL DEFAULT false,
  levantamento_documentos boolean NOT NULL DEFAULT false,
  observacoes text,
  migrar text,
  status_documento_drive text NOT NULL DEFAULT 'Não existe no Drive'
    CHECK (status_documento_drive IN ('Não existe no Drive','Pasta existe, sem contrato de locação','Só versão não assinada','Contrato assinado encontrado')),
  pasta_encontrada_drive boolean NOT NULL DEFAULT false,
  tem_doc_garantia_drive boolean NOT NULL DEFAULT false,
  n_arquivos_drive integer NOT NULL DEFAULT 0,
  nome_pasta_drive text,
  prioritario boolean NOT NULL DEFAULT false,
  inquilino text,
  endereco text,
  status_contrato text,
  garantidora text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ideali_documentos TO authenticated;
GRANT ALL ON public.ideali_documentos TO service_role;
ALTER TABLE public.ideali_documentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth can select ideali_documentos" ON public.ideali_documentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth can insert ideali_documentos" ON public.ideali_documentos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth can update ideali_documentos" ON public.ideali_documentos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth can delete ideali_documentos" ON public.ideali_documentos FOR DELETE TO authenticated USING (true);

CREATE TRIGGER trg_ideali_documentos_updated_at BEFORE UPDATE ON public.ideali_documentos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.ideali_fila_analista (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_contrato text NOT NULL UNIQUE,
  inquilino text,
  endereco text,
  status_contrato text,
  garantidora text,
  status_documento_drive text NOT NULL DEFAULT 'Não existe no Drive'
    CHECK (status_documento_drive IN ('Não existe no Drive','Pasta existe, sem contrato de locação','Só versão não assinada','Contrato assinado encontrado')),
  localizacao_documento text NOT NULL DEFAULT 'Pendente',
  status_loft_seguradora text NOT NULL DEFAULT 'Pendente',
  clausula_garantidora_presente text NOT NULL DEFAULT 'Não verificado',
  nome_inquilino_confere text NOT NULL DEFAULT 'Não verificado',
  endereco_confere text NOT NULL DEFAULT 'Não verificado',
  observacoes text,
  status_fila text NOT NULL DEFAULT 'Pendente'
    CHECK (status_fila IN ('Pendente','Em andamento','Resolvido','Sem ação possível')),
  resolvido_em timestamptz,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ideali_fila_analista TO authenticated;
GRANT ALL ON public.ideali_fila_analista TO service_role;
ALTER TABLE public.ideali_fila_analista ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth can select ideali_fila" ON public.ideali_fila_analista FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth can insert ideali_fila" ON public.ideali_fila_analista FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth can update ideali_fila" ON public.ideali_fila_analista FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth can delete ideali_fila" ON public.ideali_fila_analista FOR DELETE TO authenticated USING (true);

CREATE TRIGGER trg_ideali_fila_updated_at BEFORE UPDATE ON public.ideali_fila_analista
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_ideali_fila_ordem ON public.ideali_fila_analista(ordem);