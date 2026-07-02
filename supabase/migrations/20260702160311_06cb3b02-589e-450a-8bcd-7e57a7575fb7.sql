
ALTER TABLE public.audit_checklist_items
  ADD COLUMN IF NOT EXISTS verified_by_ai boolean NOT NULL DEFAULT false;

INSERT INTO public.audit_checklist_items (contract_id, item_number, section, item_label)
SELECT id, 25, 'Consistência no Imoview', 'Índice de reajuste: contrato × Imoview'
FROM public.audit_contracts
ON CONFLICT (contract_id, item_number) DO NOTHING;

INSERT INTO public.audit_checklist_items (contract_id, item_number, section, item_label)
SELECT id, 26, 'Consistência no Imoview', 'Garantidora: contrato × Imoview'
FROM public.audit_contracts
ON CONFLICT (contract_id, item_number) DO NOTHING;

CREATE OR REPLACE FUNCTION public.seed_audit_checklist()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  items text[][] := ARRAY[
    ['Status do imóvel e contrato','Imóvel ocupado ou desocupado'],
    ['Status do imóvel e contrato','Contrato saudável ou inadimplente'],
    ['Status do imóvel e contrato','Prazo do contrato — vigência e data de vencimento'],
    ['Dados das partes','Nome do locatário: contrato × Imoview × garantidora'],
    ['Dados das partes','Nome do locador: contrato × Imoview × garantidora'],
    ['Dados das partes','Endereço do imóvel: contrato × Imoview × garantidora'],
    ['Dados das partes','CPF/CNPJ do locatário cadastrado corretamente'],
    ['Dados das partes','Dados bancários do locador corretos para repasse'],
    ['Documentação obrigatória','Documentos pessoais do locatário (RG/CPF ou CNH)'],
    ['Documentação obrigatória','Documentos pessoais do locador'],
    ['Documentação obrigatória','Contrato de locação assinado pelo locatário'],
    ['Documentação obrigatória','Contrato de prestação de serviço assinado pelo locador'],
    ['Documentação obrigatória','Laudo de vistoria de entrada assinado'],
    ['Cobertura e contrato da garantidora','Contrato com a garantidora está ativo e vigente'],
    ['Cobertura e contrato da garantidora','Valor do aluguel cadastrado na garantidora bate com o contrato'],
    ['Cobertura e contrato da garantidora','Cobertura contratada — quais encargos estão incluídos'],
    ['Cobertura e contrato da garantidora','Prazo de cobertura alinhado com vigência do contrato de locação'],
    ['Cobertura e contrato da garantidora','Forma de pagamento da taxa da garantidora (carta de crédito recorrente ou PVI)'],
    ['Cobertura e contrato da garantidora','Contrato da garantidora assinado por todas as partes'],
    ['Consistência no Imoview','Tipo de garantia cadastrado como ''garantidora'' (não seguro fiança)'],
    ['Consistência no Imoview','Garantidora correta associada ao contrato no Imoview'],
    ['Consistência no Imoview','Valor do aluguel, condomínio e IPTU cadastrados corretamente'],
    ['Consistência no Imoview','Índice de reajuste: contrato × Imoview'],
    ['Consistência no Imoview','Garantidora: contrato × Imoview']
  ];
  i int;
BEGIN
  FOR i IN 1..array_length(items,1) LOOP
    INSERT INTO public.audit_checklist_items(contract_id, item_number, section, item_label)
    VALUES (NEW.id, i, items[i][1], items[i][2]);
  END LOOP;

  IF NEW.garantidora = 'Loft' THEN
    INSERT INTO public.audit_checklist_items(contract_id, item_number, section, item_label) VALUES
      (NEW.id, 27, 'Específico — Loft', 'Verificar forma de pagamento (boleto / cartão / PVI)'),
      (NEW.id, 28, 'Específico — Loft', 'Verificar data de renovação');
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_loft_checklist_items()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.garantidora IS DISTINCT FROM OLD.garantidora THEN
    IF NEW.garantidora = 'Loft' THEN
      INSERT INTO public.audit_checklist_items(contract_id, item_number, section, item_label) VALUES
        (NEW.id, 27, 'Específico — Loft', 'Verificar forma de pagamento (boleto / cartão / PVI)'),
        (NEW.id, 28, 'Específico — Loft', 'Verificar data de renovação')
      ON CONFLICT (contract_id, item_number) DO NOTHING;
    ELSE
      DELETE FROM public.audit_checklist_items
      WHERE contract_id = NEW.id AND item_number IN (27,28) AND status = 'pending';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
