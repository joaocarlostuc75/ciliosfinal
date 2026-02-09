
-- ==========================================
-- 1. LIMPEZA E CONFIGURAÇÃO INICIAL
-- ==========================================

-- Habilita extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Limpa tabelas existentes para recriação limpa (Cuidado em produção!)
DROP VIEW IF EXISTS public_busy_times;
DROP TABLE IF EXISTS product_orders CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS blocked_times CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS system_plans CASCADE; -- Nova Tabela
DROP TABLE IF EXISTS salons CASCADE;
DROP TABLE IF EXISTS global_settings CASCADE;

-- ==========================================
-- 2. CRIAÇÃO DAS TABELAS
-- ==========================================

-- 2.1 Configurações Globais (Apenas Super Admin edita)
CREATE TABLE global_settings (
  id text PRIMARY KEY DEFAULT 'global',
  default_logo_url text,
  updated_at timestamptz DEFAULT now()
);

-- 2.2 Planos do Sistema (Gestão de Assinaturas - Super Admin)
CREATE TABLE system_plans (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  price numeric(10,2) NOT NULL DEFAULT 0,
  period text CHECK (period IN ('monthly', 'yearly')) DEFAULT 'monthly',
  features text[] DEFAULT '{}', -- Array de funcionalidades
  is_popular boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 2.3 Salões (Clientes do Super Admin / Multi-tenancy Core)
CREATE TABLE salons (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id uuid REFERENCES auth.users(id), -- Vincula ao usuário do Supabase Auth
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  phone text,
  address text,
  theme_color text DEFAULT '#C5A059',
  opening_hours jsonb DEFAULT '[]'::jsonb,
  
  -- Campos de Controle do Super Admin
  subscription_status text DEFAULT 'TRIAL' CHECK (subscription_status IN ('TRIAL', 'ACTIVE', 'EXPIRED', 'BLOCKED', 'CANCELLED')),
  subscription_plan text DEFAULT 'FREE', -- Pode ser o nome do plano ou ID
  subscription_end_date timestamptz,
  is_lifetime_free boolean DEFAULT false,
  
  owner_email text, -- Mantido para busca rápida no painel admin
  created_at timestamptz DEFAULT now()
);

-- 2.4 Serviços (Nível Salão)
CREATE TABLE services (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id uuid REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  duration_min integer NOT NULL DEFAULT 30,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- 2.5 Produtos (Nível Salão)
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id uuid REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  stock integer DEFAULT 0,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- 2.6 Clientes Finais (Nível Salão)
CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id uuid REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  whatsapp text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(salon_id, whatsapp) -- Evita duplicidade de cliente no mesmo salão
);

-- 2.7 Agendamentos
CREATE TABLE appointments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id uuid REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status text DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED')),
  created_at timestamptz DEFAULT now()
);

-- 2.8 Pedidos de Produtos
CREATE TABLE product_orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id uuid REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  client_phone text NOT NULL,
  status text DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED')),
  created_at timestamptz DEFAULT now()
);

-- 2.9 Bloqueios de Agenda
CREATE TABLE blocked_times (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id uuid REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now()
);

-- ==========================================
-- 3. VIEW PÚBLICA (Para cálculo de horários livres)
-- ==========================================
CREATE OR REPLACE VIEW public_busy_times AS
SELECT 
  salon_id, 
  start_time, 
  end_time, 
  'appointment' as type 
FROM appointments 
WHERE status != 'CANCELLED'
UNION ALL
SELECT 
  salon_id, 
  start_time, 
  end_time, 
  'blocked' as type 
FROM blocked_times;

-- ==========================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_times ENABLE ROW LEVEL SECURITY;

-- --- Helper para Super Admin ---
-- IMPORTANTE: Substitua pelo email real do seu usuário Super Admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (SELECT email FROM auth.users WHERE id = auth.uid()) = 'joaocarlostuc75@gmail.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- Helper para verificar dono do salão ---
CREATE OR REPLACE FUNCTION is_salon_owner(row_salon_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM salons 
    WHERE id = row_salon_id AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.1 POLÍTICAS: GLOBAL SETTINGS
CREATE POLICY "Public Read Settings" ON global_settings FOR SELECT USING (true);
CREATE POLICY "Super Admin Manage Settings" ON global_settings FOR ALL USING (is_super_admin());

-- 4.2 POLÍTICAS: SYSTEM PLANS (Novo)
CREATE POLICY "Public Read Plans" ON system_plans FOR SELECT USING (true);
CREATE POLICY "Super Admin Manage Plans" ON system_plans FOR ALL USING (is_super_admin());

-- 4.3 POLÍTICAS: SALONS
CREATE POLICY "Public Read Salons" ON salons FOR SELECT USING (true);
CREATE POLICY "Owner Update Salon" ON salons FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Owner Insert Salon" ON salons FOR INSERT WITH CHECK (auth.uid() = owner_id);
-- Super Admin tem acesso total para bloquear/editar qualquer salão
CREATE POLICY "Super Admin Manage Salons" ON salons FOR ALL USING (is_super_admin());

-- 4.4 POLÍTICAS: SERVICES & PRODUCTS
CREATE POLICY "Public Read Services" ON services FOR SELECT USING (true);
CREATE POLICY "Owner Manage Services" ON services FOR ALL USING (is_salon_owner(salon_id));

CREATE POLICY "Public Read Products" ON products FOR SELECT USING (true);
CREATE POLICY "Owner Manage Products" ON products FOR ALL USING (is_salon_owner(salon_id));

-- 4.5 POLÍTICAS: CLIENTS
CREATE POLICY "Public Insert Clients" ON clients FOR INSERT WITH CHECK (true); 
CREATE POLICY "Owner Manage Clients" ON clients FOR ALL USING (is_salon_owner(salon_id));

-- 4.6 POLÍTICAS: APPOINTMENTS
CREATE POLICY "Public Insert Appointments" ON appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Owner Manage Appointments" ON appointments FOR ALL USING (is_salon_owner(salon_id));

-- 4.7 POLÍTICAS: ORDERS
CREATE POLICY "Public Insert Orders" ON product_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Owner Manage Orders" ON product_orders FOR ALL USING (is_salon_owner(salon_id));

-- 4.8 POLÍTICAS: BLOCKED TIMES
CREATE POLICY "Public Read Blocks" ON blocked_times FOR SELECT USING (true);
CREATE POLICY "Owner Manage Blocks" ON blocked_times FOR ALL USING (is_salon_owner(salon_id));

-- ==========================================
-- 5. STORAGE (BUCKETS)
-- ==========================================

INSERT INTO storage.buckets (id, name, public) 
VALUES ('salon-media', 'salon-media', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for Storage (Drop if exists to avoid errors on re-run)
DROP POLICY IF EXISTS "Public Access Media" ON storage.objects;
DROP POLICY IF EXISTS "Auth Upload Media" ON storage.objects;
DROP POLICY IF EXISTS "Owner Delete Media" ON storage.objects;

CREATE POLICY "Public Access Media" ON storage.objects FOR SELECT USING (bucket_id = 'salon-media');
CREATE POLICY "Auth Upload Media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'salon-media' AND auth.role() = 'authenticated');
CREATE POLICY "Owner Delete Media" ON storage.objects FOR DELETE USING (bucket_id = 'salon-media' AND auth.uid() = owner);

-- ==========================================
-- 6. DADOS INICIAIS (SEED)
-- ==========================================

-- Configuração Global Padrão
INSERT INTO global_settings (id, default_logo_url) 
VALUES ('global', 'https://via.placeholder.com/300?text=System')
ON CONFLICT (id) DO NOTHING;

-- Planos Padrão (Seed)
INSERT INTO system_plans (name, price, period, features, is_popular) VALUES
('Plano Bronze', 149.00, 'monthly', ARRAY['1 Usuário', 'Agenda Básica', 'Suporte por Email'], false),
('Plano Silver', 289.00, 'monthly', ARRAY['3 Usuários', 'Agenda Avançada', 'Gestão Financeira', 'Suporte Prioritário'], true),
('Plano Gold VIP', 450.00, 'monthly', ARRAY['Ilimitado', 'Todas as funcionalidades', 'Consultoria Mensal', 'Home Care Kit'], false);
