create extension if not exists pg_cron;
create extension if not exists pg_net;

create schema if not exists private;
revoke all on schema private from anon, authenticated;

create table if not exists private.sync_secrets (
  name text primary key,
  value text not null,
  created_at timestamptz not null default now()
);

alter table private.sync_secrets enable row level security;
revoke all on table private.sync_secrets from anon, authenticated;

insert into private.sync_secrets (name, value)
values ('credpago_cron', replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''))
on conflict (name) do nothing;

create or replace function public.verify_sync_token(_token text)
returns boolean
language sql
stable
security definer
set search_path = private, public
as $$
  select exists (
    select 1 from private.sync_secrets
    where name = 'credpago_cron' and value = _token
  )
$$;

revoke all on function public.verify_sync_token(text) from public;
revoke all on function public.verify_sync_token(text) from anon;
revoke all on function public.verify_sync_token(text) from authenticated;
grant execute on function public.verify_sync_token(text) to service_role;