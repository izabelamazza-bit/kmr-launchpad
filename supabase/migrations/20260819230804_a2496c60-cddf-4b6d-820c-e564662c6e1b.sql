DELETE FROM public.guarantor_portal_snapshots
WHERE import_id IN (
  SELECT id FROM public.guarantor_portal_imports
  WHERE origem = 'api' AND tipo = 'contrato'
);

DELETE FROM public.guarantor_portal_imports
WHERE origem = 'api' AND tipo = 'contrato';