
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
DROP TABLE IF EXISTS salons CASCADE;
DROP TABLE IF EXISTS global_settings CASCADE;

-- ==========================================
-- 2. CRIAÇÃO DAS TABELAS
-- ==========================================

-- Configurações Globais (Apenas Super Admin edita, Público lê)
CREATE TABLE global_settings (
  id text PRIMARY KEY DEFAULT 'global',
  default_logo_url text,
  updated_at timestamptz DEFAULT now()
);

-- Salões (Multi-tenancy Core)
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
  
  -- Campos de Assinatura
  subscription_status text DEFAULT 'TRIAL' CHECK (subscription_status IN ('TRIAL', 'ACTIVE', 'EXPIRED', 'BLOCKED', 'CANCELLED')),
  subscription_plan text DEFAULT 'FREE',
  subscription_end_date timestamptz,
  is_lifetime_free boolean DEFAULT false,
  
  owner_email text, -- Mantido para compatibilidade visual, mas owner_id é usado para segurança
  created_at timestamptz DEFAULT now()
);

-- Serviços
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

-- Produtos
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

-- Clientes
CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id uuid REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  whatsapp text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(salon_id, whatsapp) -- Evita duplicidade de cliente no mesmo salão
);

-- Agendamentos
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

-- Pedidos de Produtos
CREATE TABLE product_orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id uuid REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  client_phone text NOT NULL,
  status text DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED')),
  created_at timestamptz DEFAULT now()
);

-- Bloqueios de Agenda
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
-- Permite que o frontend consulte horários ocupados sem expor dados sensíveis do cliente
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
ALTER TABLE salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_times ENABLE ROW LEVEL SECURITY;

-- --- Helper para Super Admin ---
-- Substitua pelo email real do Super Admin
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

-- 4.2 POLÍTICAS: SALONS
CREATE POLICY "Public Read Salons" ON salons FOR SELECT USING (true);
CREATE POLICY "Owner Update Salon" ON salons FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Owner Insert Salon" ON salons FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Super Admin Manage Salons" ON salons FOR ALL USING (is_super_admin());

-- 4.3 POLÍTICAS: SERVICES & PRODUCTS (Público vê, Dono gerencia)
-- Services
CREATE POLICY "Public Read Services" ON services FOR SELECT USING (true);
CREATE POLICY "Owner Manage Services" ON services FOR ALL USING (is_salon_owner(salon_id));
-- Products
CREATE POLICY "Public Read Products" ON products FOR SELECT USING (true);
CREATE POLICY "Owner Manage Products" ON products FOR ALL USING (is_salon_owner(salon_id));

-- 4.4 POLÍTICAS: CLIENTS (Público cria, Dono gerencia)
-- Importante: Insert público permitido para fluxo de agendamento sem login
CREATE POLICY "Public Insert Clients" ON clients FOR INSERT WITH CHECK (true); 
CREATE POLICY "Owner Manage Clients" ON clients FOR ALL USING (is_salon_owner(salon_id));

-- 4.5 POLÍTICAS: APPOINTMENTS (Público cria, Dono gerencia)
CREATE POLICY "Public Insert Appointments" ON appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Owner Manage Appointments" ON appointments FOR ALL USING (is_salon_owner(salon_id));

-- 4.6 POLÍTICAS: ORDERS (Público cria, Dono gerencia)
CREATE POLICY "Public Insert Orders" ON product_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Owner Manage Orders" ON product_orders FOR ALL USING (is_salon_owner(salon_id));

-- 4.7 POLÍTICAS: BLOCKED TIMES (Público vê via View, Dono gerencia)
-- Nota: A leitura direta da tabela bloqueada para público não é estritamente necessária se usarem a VIEW, 
-- mas útil para lógica frontend. Vamos liberar leitura.
CREATE POLICY "Public Read Blocks" ON blocked_times FOR SELECT USING (true);
CREATE POLICY "Owner Manage Blocks" ON blocked_times FOR ALL USING (is_salon_owner(salon_id));

-- ==========================================
-- 5. STORAGE (BUCKETS)
-- ==========================================

INSERT INTO storage.buckets (id, name, public) 
VALUES ('salon-media', 'salon-media', true)
ON CONFLICT (id) DO NOTHING;

-- Política de Storage: Qualquer um vê, apenas autenticado faz upload
CREATE POLICY "Public Access Media" ON storage.objects FOR SELECT USING (bucket_id = 'salon-media');
CREATE POLICY "Auth Upload Media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'salon-media' AND auth.role() = 'authenticated');
CREATE POLICY "Owner Delete Media" ON storage.objects FOR DELETE USING (bucket_id = 'salon-media' AND auth.uid() = owner);

-- ==========================================
-- 6. ÍNDICES DE PERFORMANCE
-- ==========================================

CREATE INDEX idx_salons_owner ON salons(owner_id);
CREATE INDEX idx_services_salon ON services(salon_id);
CREATE INDEX idx_products_salon ON products(salon_id);
CREATE INDEX idx_clients_salon_phone ON clients(salon_id, whatsapp);
CREATE INDEX idx_appointments_salon_date ON appointments(salon_id, start_time);
CREATE INDEX idx_appointments_client ON appointments(client_id);
CREATE INDEX idx_orders_salon ON product_orders(salon_id);

-- ==========================================
-- 7. DADOS INICIAIS (SEED)
-- ==========================================

-- Configuração Global Padrão
INSERT INTO global_settings (id, default_logo_url) 
VALUES ('global', 'https://via.placeholder.com/300?text=J.C+System')
ON CONFLICT (id) DO NOTHING;

-- Salão Demo (Opcional - útil para teste imediato)
-- Nota: owner_id deve ser um UUID válido de um usuário criado em auth.users se quiser testar login real.
-- Aqui usamos um UUID genérico, o login falhará a menos que esse usuário exista no Auth.
INSERT INTO salons (id, name, slug, phone, address, logo_url, opening_hours, subscription_status, owner_email)
VALUES (
  'e2c0a884-6d9e-4861-a9d5-17154238805f', 
  'Cílios de Luxo (Demo)', 
  'cilios-de-luxo', 
  '11999999999', 
  'Rua Demo, 123',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDyZu1A9B65hwLOA7DqdEmC2YsZaegwppquE_7UOU2hNkKa8h9EgPPxfmzh1cRWYJze9ad8I1GEgg5LswAjm4MUyJiFIz3FjroXYuA_HsJ99PIzxDrCDNgOX_qnsynkNAyRF1zPHTYj4iMd6k8dnrhiLK4TEpsTLIOk0sAku4K_nfNFLCOVBqEcNF_1e-Rl561XB5NwalEa5_d2pcoRiqbhIytoUmtK2OuK1fZAB4AQLk3YKJZyEq5t0oYd_4mzvUw4CipgSEH_eQ',
  '[{"dayOfWeek": 0, "isOpen": false, "slots": []}, {"dayOfWeek": 1, "isOpen": true, "slots": [{"start": "09:00", "end": "12:00"}, {"start": "13:00", "end": "18:00"}]}, {"dayOfWeek": 2, "isOpen": true, "slots": [{"start": "09:00", "end": "12:00"}, {"start": "13:00", "end": "18:00"}]}, {"dayOfWeek": 3, "isOpen": true, "slots": [{"start": "09:00", "end": "12:00"}, {"start": "13:00", "end": "18:00"}]}, {"dayOfWeek": 4, "isOpen": true, "slots": [{"start": "09:00", "end": "12:00"}, {"start": "13:00", "end": "18:00"}]}, {"dayOfWeek": 5, "isOpen": true, "slots": [{"start": "09:00", "end": "12:00"}, {"start": "13:00", "end": "18:00"}]}, {"dayOfWeek": 6, "isOpen": true, "slots": [{"start": "09:00", "end": "14:00"}]}]'::jsonb,
  'TRIAL',
  'joaocarlostuc75@gmail.com'
) ON CONFLICT (id) DO NOTHING;
