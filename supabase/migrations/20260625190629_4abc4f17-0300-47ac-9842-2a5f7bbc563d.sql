
ALTER TABLE public.audit_contracts
  ADD COLUMN IF NOT EXISTS locatario_nome text,
  ADD COLUMN IF NOT EXISTS locatario_cpf text,
  ADD COLUMN IF NOT EXISTS locador_nome text,
  ADD COLUMN IF NOT EXISTS endereco_imovel text;

-- Limpar linhas de extração criadas por importação anterior (sem PDF)
DELETE FROM public.audit_contract_extracted_data e
USING public.audit_contracts c
WHERE e.contract_id = c.id
  AND c.import_batch_id IS NOT NULL
  AND (e.pdf_url IS NULL OR e.pdf_url = '');
