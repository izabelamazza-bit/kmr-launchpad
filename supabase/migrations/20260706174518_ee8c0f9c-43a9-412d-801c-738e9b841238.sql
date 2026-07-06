create or replace view public.audit_contract_progress as
select
  c.id as contract_id,
  count(i.*)::int                                              as total_items,
  count(i.*) filter (where i.status = 'ok')::int               as ok_items,
  count(i.*) filter (where i.status = 'nok')::int              as nok_items,
  coalesce(bool_or(i.status = 'nok' and i.item_number in (4,5,6,7)), false) as has_critical_nok
from public.audit_contracts c
left join public.audit_checklist_items i on i.contract_id = c.id
group by c.id;

grant select on public.audit_contract_progress to authenticated;