
-- Create users_registry table
CREATE TABLE public.users_registry (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  phone TEXT,
  access_profile TEXT NOT NULL DEFAULT 'user',
  status TEXT NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create companies table
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT NOT NULL,
  cnpj TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  phone TEXT,
  cep TEXT,
  logradouro TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  estado TEXT,
  status TEXT NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create people table
CREATE TABLE public.people (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  cpf TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  phone TEXT,
  birth_date DATE,
  cep TEXT,
  logradouro TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  estado TEXT,
  status TEXT NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products_services table
CREATE TABLE public.products_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('produto', 'serviço')),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.users_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products_services ENABLE ROW LEVEL SECURITY;

-- RLS policies for users_registry
CREATE POLICY "Authenticated users can select users_registry" ON public.users_registry FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert users_registry" ON public.users_registry FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update users_registry" ON public.users_registry FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete users_registry" ON public.users_registry FOR DELETE TO authenticated USING (true);

-- RLS policies for companies
CREATE POLICY "Authenticated users can select companies" ON public.companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert companies" ON public.companies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update companies" ON public.companies FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete companies" ON public.companies FOR DELETE TO authenticated USING (true);

-- RLS policies for people
CREATE POLICY "Authenticated users can select people" ON public.people FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert people" ON public.people FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update people" ON public.people FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete people" ON public.people FOR DELETE TO authenticated USING (true);

-- RLS policies for products_services
CREATE POLICY "Authenticated users can select products_services" ON public.products_services FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert products_services" ON public.products_services FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update products_services" ON public.products_services FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete products_services" ON public.products_services FOR DELETE TO authenticated USING (true);
