
-- ============= ROLES =============
CREATE TYPE public.app_role AS ENUM ('admin', 'supervisor', 'analista');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_supervisor_or_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin','supervisor')
  )
$$;

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_supervisor_or_admin(auth.uid()));

-- Auto-assigns a role on first login. First user becomes admin; others become analista.
CREATE OR REPLACE FUNCTION public.ensure_user_role()
RETURNS public.app_role
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _existing public.app_role;
  _has_admin boolean;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT role INTO _existing FROM public.user_roles WHERE user_id = _uid LIMIT 1;
  IF _existing IS NOT NULL THEN RETURN _existing; END IF;

  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') INTO _has_admin;
  IF NOT _has_admin THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (_uid, 'admin');
    RETURN 'admin';
  ELSE
    INSERT INTO public.user_roles(user_id, role) VALUES (_uid, 'analista');
    RETURN 'analista';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_user_role() TO authenticated;

-- ============= AUDIT CONTRACTS =============
CREATE TABLE public.audit_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  imoview_number text NOT NULL UNIQUE,
  garantidora text CHECK (garantidora IN ('Loft','Credaluga','KMR')),
  ocupacao text CHECK (ocupacao IN ('Ocupado','Desocupado')),
  status_contrato text CHECK (status_contrato IN ('Saudavel','Inadimplente')),
  analyst_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  analyst_name text,
  general_notes text,
  audit_status text NOT NULL DEFAULT 'Nao iniciada'
    CHECK (audit_status IN ('Nao iniciada','Em andamento','Com pendencia','Completa')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.audit_contracts TO authenticated;
GRANT ALL ON public.audit_contracts TO service_role;

ALTER TABLE public.audit_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_contracts_select" ON public.audit_contracts FOR SELECT TO authenticated
USING (public.is_supervisor_or_admin(auth.uid()) OR analyst_id = auth.uid() OR created_by = auth.uid());

CREATE POLICY "audit_contracts_insert" ON public.audit_contracts FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "audit_contracts_update" ON public.audit_contracts FOR UPDATE TO authenticated
USING (public.is_supervisor_or_admin(auth.uid()) OR analyst_id = auth.uid() OR created_by = auth.uid())
WITH CHECK (public.is_supervisor_or_admin(auth.uid()) OR analyst_id = auth.uid() OR created_by = auth.uid());

CREATE POLICY "audit_contracts_delete" ON public.audit_contracts FOR DELETE TO authenticated
USING (public.is_supervisor_or_admin(auth.uid()));

CREATE TRIGGER audit_contracts_updated_at BEFORE UPDATE ON public.audit_contracts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= EXTRACTED DATA =============
CREATE TABLE public.audit_contract_extracted_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL UNIQUE REFERENCES public.audit_contracts(id) ON DELETE CASCADE,
  locadores text,
  locatarios text,
  cpf_locatarios text,
  endereco_imovel text,
  data_inicio date,
  data_termino date,
  prazo_meses int,
  valor_aluguel numeric(12,2),
  indice_reajuste text,
  dia_vencimento int,
  garantidora_identificada_raw text,
  garantidora_normalizada text,
  clausula_garantia_trecho text,
  assinatura_digital boolean,
  observacoes_extracao text,
  pdf_url text,
  extracted_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.audit_contract_extracted_data TO authenticated;
GRANT ALL ON public.audit_contract_extracted_data TO service_role;

ALTER TABLE public.audit_contract_extracted_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "extracted_data_all" ON public.audit_contract_extracted_data FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.audit_contracts c WHERE c.id = contract_id
  AND (public.is_supervisor_or_admin(auth.uid()) OR c.analyst_id = auth.uid() OR c.created_by = auth.uid())))
WITH CHECK (EXISTS (SELECT 1 FROM public.audit_contracts c WHERE c.id = contract_id
  AND (public.is_supervisor_or_admin(auth.uid()) OR c.analyst_id = auth.uid() OR c.created_by = auth.uid())));

CREATE TRIGGER extracted_data_updated_at BEFORE UPDATE ON public.audit_contract_extracted_data
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= CHECKLIST =============
CREATE TABLE public.audit_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.audit_contracts(id) ON DELETE CASCADE,
  item_number int NOT NULL,
  item_label text NOT NULL,
  section text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','ok','nok')),
  observation text,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (contract_id, item_number)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.audit_checklist_items TO authenticated;
GRANT ALL ON public.audit_checklist_items TO service_role;

ALTER TABLE public.audit_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checklist_all" ON public.audit_checklist_items FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.audit_contracts c WHERE c.id = contract_id
  AND (public.is_supervisor_or_admin(auth.uid()) OR c.analyst_id = auth.uid() OR c.created_by = auth.uid())))
WITH CHECK (EXISTS (SELECT 1 FROM public.audit_contracts c WHERE c.id = contract_id
  AND (public.is_supervisor_or_admin(auth.uid()) OR c.analyst_id = auth.uid() OR c.created_by = auth.uid())));

CREATE TRIGGER checklist_items_updated_at BEFORE UPDATE ON public.audit_checklist_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= SEED CHECKLIST ON CONTRACT CREATE =============
CREATE OR REPLACE FUNCTION public.seed_audit_checklist()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
    ['Consistência no Imoview','Valor do aluguel, condomínio e IPTU cadastrados corretamente']
  ];
  i int;
BEGIN
  FOR i IN 1..array_length(items,1) LOOP
    INSERT INTO public.audit_checklist_items(contract_id, item_number, section, item_label)
    VALUES (NEW.id, i, items[i][1], items[i][2]);
  END LOOP;

  IF NEW.garantidora = 'Loft' THEN
    INSERT INTO public.audit_checklist_items(contract_id, item_number, section, item_label) VALUES
      (NEW.id, 23, 'Específico — Loft', 'Verificar forma de pagamento (boleto / cartão / PVI)'),
      (NEW.id, 24, 'Específico — Loft', 'Verificar data de renovação');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_seed_audit_checklist AFTER INSERT ON public.audit_contracts
FOR EACH ROW EXECUTE FUNCTION public.seed_audit_checklist();

-- ============= ADD/REMOVE LOFT-SPECIFIC ITEMS ON GARANTIDORA CHANGE =============
CREATE OR REPLACE FUNCTION public.sync_loft_checklist_items()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.garantidora IS DISTINCT FROM OLD.garantidora THEN
    IF NEW.garantidora = 'Loft' THEN
      INSERT INTO public.audit_checklist_items(contract_id, item_number, section, item_label) VALUES
        (NEW.id, 23, 'Específico — Loft', 'Verificar forma de pagamento (boleto / cartão / PVI)'),
        (NEW.id, 24, 'Específico — Loft', 'Verificar data de renovação')
      ON CONFLICT (contract_id, item_number) DO NOTHING;
    ELSE
      DELETE FROM public.audit_checklist_items
      WHERE contract_id = NEW.id AND item_number IN (23,24) AND status = 'pending';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_loft_checklist AFTER UPDATE ON public.audit_contracts
FOR EACH ROW EXECUTE FUNCTION public.sync_loft_checklist_items();

-- ============= RECALCULATE AUDIT STATUS =============
CREATE OR REPLACE FUNCTION public.recalc_audit_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _contract_id uuid := COALESCE(NEW.contract_id, OLD.contract_id);
  _total int;
  _ok int;
  _nok int;
  _pending int;
  _new_status text;
BEGIN
  SELECT count(*),
         count(*) FILTER (WHERE status='ok'),
         count(*) FILTER (WHERE status='nok'),
         count(*) FILTER (WHERE status='pending')
  INTO _total, _ok, _nok, _pending
  FROM public.audit_checklist_items WHERE contract_id = _contract_id;

  IF _total = 0 OR _ok + _nok = 0 THEN
    _new_status := 'Nao iniciada';
  ELSIF _nok > 0 THEN
    _new_status := 'Com pendencia';
  ELSIF _ok = _total THEN
    _new_status := 'Completa';
  ELSE
    _new_status := 'Em andamento';
  END IF;

  UPDATE public.audit_contracts SET audit_status = _new_status, updated_at = now()
  WHERE id = _contract_id;

  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_recalc_audit_status
AFTER INSERT OR UPDATE OF status OR DELETE ON public.audit_checklist_items
FOR EACH ROW EXECUTE FUNCTION public.recalc_audit_status();
