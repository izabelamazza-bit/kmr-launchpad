
ALTER TABLE public.audit_contracts
  ADD COLUMN IF NOT EXISTS empresa text,
  ADD COLUMN IF NOT EXISTS valor_aluguel numeric(12,2),
  ADD COLUMN IF NOT EXISTS data_inicio date,
  ADD COLUMN IF NOT EXISTS data_fim date,
  ADD COLUMN IF NOT EXISTS data_proximo_reajuste date,
  ADD COLUMN IF NOT EXISTS indice_reajuste text,
  ADD COLUMN IF NOT EXISTS import_batch_id uuid;

ALTER TABLE public.audit_contracts
  DROP CONSTRAINT IF EXISTS audit_contracts_empresa_check;
ALTER TABLE public.audit_contracts
  ADD CONSTRAINT audit_contracts_empresa_check
  CHECK (empresa IS NULL OR empresa IN ('Rotina','Alugar'));

ALTER TABLE public.audit_contracts
  DROP CONSTRAINT IF EXISTS audit_contracts_garantidora_check;
ALTER TABLE public.audit_contracts
  ADD CONSTRAINT audit_contracts_garantidora_check
  CHECK (garantidora IS NULL OR garantidora IN ('Loft','Credaluga','KMR','Alerta'));
