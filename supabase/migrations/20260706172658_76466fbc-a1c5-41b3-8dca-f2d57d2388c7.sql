CREATE OR REPLACE FUNCTION public.recalc_audit_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _contract_id uuid := COALESCE(NEW.contract_id, OLD.contract_id);
  _total int;
  _filled int;
  _new_status text;
BEGIN
  SELECT count(*),
         count(*) FILTER (WHERE status IN ('ok','nok'))
  INTO _total, _filled
  FROM public.audit_checklist_items WHERE contract_id = _contract_id;

  IF _total = 0 OR _filled = 0 THEN
    _new_status := 'Nao iniciada';
  ELSIF _filled = _total THEN
    _new_status := 'Completa';
  ELSE
    _new_status := 'Em andamento';
  END IF;

  UPDATE public.audit_contracts SET audit_status = _new_status, updated_at = now()
  WHERE id = _contract_id;

  RETURN NULL;
END;
$function$;

-- Recalcular todos os contratos existentes
DO $$
DECLARE
  r record;
  _total int;
  _filled int;
  _new_status text;
BEGIN
  FOR r IN SELECT id FROM public.audit_contracts LOOP
    SELECT count(*), count(*) FILTER (WHERE status IN ('ok','nok'))
      INTO _total, _filled
      FROM public.audit_checklist_items WHERE contract_id = r.id;
    IF _total = 0 OR _filled = 0 THEN _new_status := 'Nao iniciada';
    ELSIF _filled = _total THEN _new_status := 'Completa';
    ELSE _new_status := 'Em andamento';
    END IF;
    UPDATE public.audit_contracts SET audit_status = _new_status, updated_at = now() WHERE id = r.id;
  END LOOP;
END $$;