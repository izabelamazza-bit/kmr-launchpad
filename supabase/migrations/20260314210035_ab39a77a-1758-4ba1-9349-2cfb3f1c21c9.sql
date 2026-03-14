
ALTER TABLE public.leads ADD COLUMN channel_status text NOT NULL DEFAULT 'ai_active';
ALTER TABLE public.leads ADD COLUMN assigned_to uuid;

ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
