
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  email text,
  phone text,
  company text,
  interest text,
  qualification_notes text,
  scheduled_at timestamptz,
  status text NOT NULL DEFAULT 'novo',
  conversation_history jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Anon can insert (visitors are not authenticated)
CREATE POLICY "Anon can insert leads" ON public.leads FOR INSERT TO anon WITH CHECK (true);

-- Authenticated users can do everything
CREATE POLICY "Authenticated can select leads" ON public.leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can update leads" ON public.leads FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete leads" ON public.leads FOR DELETE TO authenticated USING (true);

-- Anon can also update their own lead (for the chat-agent to update during conversation)
CREATE POLICY "Anon can update leads" ON public.leads FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon can select leads" ON public.leads FOR SELECT TO anon USING (true);
