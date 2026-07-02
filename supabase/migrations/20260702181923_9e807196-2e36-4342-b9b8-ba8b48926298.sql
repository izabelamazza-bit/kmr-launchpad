
-- Remover trigger + função Loft-específica
DROP TRIGGER IF EXISTS sync_loft_checklist_items_trigger ON public.audit_contracts;
DROP TRIGGER IF EXISTS audit_contracts_sync_loft ON public.audit_contracts;
DROP FUNCTION IF EXISTS public.sync_loft_checklist_items() CASCADE;

-- Reescrever seed_audit_checklist com novo mapa de itens (sem lógica Loft)
CREATE OR REPLACE FUNCTION public.seed_audit_checklist()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  items jsonb := '[
    [1,  "Status do imóvel e contrato", "Imóvel ocupado ou desocupado"],
    [2,  "Status do imóvel e contrato", "Contrato saudável ou inadimplente"],
    [3,  "Status do imóvel e contrato", "Prazo do contrato — vigência e data de vencimento"],
    [4,  "Dados das partes: contrato × Imoview", "Nome do locatário — contrato × Imoview"],
    [5,  "Dados das partes: contrato × Imoview", "Nome do locador — contrato × Imoview"],
    [6,  "Dados das partes: contrato × Imoview", "Endereço do imóvel — contrato × Imoview"],
    [7,  "Dados das partes: contrato × Imoview", "CPF do locatário — contrato × Imoview"],
    [9,  "Documentação", "Documentos pessoais do locatário (RG/CPF ou CNH)"],
    [10, "Documentação", "Documentos pessoais do locador"],
    [11, "Documentação", "Contrato de locação assinado pelo locatário"],
    [13, "Documentação", "Laudo de vistoria de entrada assinado"],
    [14, "Cobertura e contrato da garantidora", "Contrato com a garantidora está ativo e vigente"],
    [15, "Cobertura e contrato da garantidora", "Valor do aluguel no Imoview bate com o cadastrado no portal da garantidora"],
    [16, "Cobertura e contrato da garantidora", "Condomínio e taxas contratados?"],
    [17, "Cobertura e contrato da garantidora", "Prazo de cobertura alinhado com vigência do contrato de locação"],
    [18, "Cobertura e contrato da garantidora", "Forma de pagamento da taxa da garantidora (carta de crédito recorrente ou PVI)"],
    [23, "Cobertura e contrato da garantidora", "Locatário cadastrado na garantidora com os mesmos dados do contrato (nome e CPF)"],
    [19, "Cobertura e contrato da garantidora", "Contrato da garantidora assinado por todas as partes"],
    [27, "Específico garantidora", "Verificar forma de pagamento da taxa (boleto / cartão / PVI)"],
    [28, "Específico garantidora", "Verificar data de renovação da garantidora"]
  ]'::jsonb;
  rec jsonb;
BEGIN
  FOR rec IN SELECT * FROM jsonb_array_elements(items) LOOP
    INSERT INTO public.audit_checklist_items(contract_id, item_number, section, item_label)
    VALUES (NEW.id, (rec->>0)::int, rec->>1, rec->>2)
    ON CONFLICT (contract_id, item_number) DO NOTHING;
  END LOOP;
  RETURN NEW;
END;
$function$;
