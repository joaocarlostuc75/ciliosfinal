
-- LIMPEZA TOTAL (Necessária para corrigir conflitos de esquema antigos)
DROP VIEW IF EXISTS public_busy_times;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS blocked_times CASCADE;
DROP TABLE IF EXISTS product_orders CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS salons CASCADE;

-- 1. ATIVAR EXTENSÕES
create extension if not exists "uuid-ossp";

-- 2. TABELAS

-- Salões
create table if not exists salons (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  logo_url text,
  phone text,
  address text,
  theme_color text,
  opening_hours jsonb default '[]'::jsonb,
  subscription_status text default 'TRIAL' check (subscription_status in ('TRIAL', 'ACTIVE', 'EXPIRED', 'BLOCKED')),
  owner_email text,
  created_at timestamptz default now()
);

-- Serviços
create table if not exists services (
  id uuid primary key default uuid_generate_v4(),
  salon_id uuid references salons(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10,2) not null,
  duration_min integer not null,
  image_url text,
  created_at timestamptz default now()
);

-- Produtos
create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  salon_id uuid references salons(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10,2) not null,
  stock integer default 0,
  image_url text,
  created_at timestamptz default now()
);

-- Clientes
create table if not exists clients (
  id uuid primary key default uuid_generate_v4(),
  salon_id uuid references salons(id) on delete cascade,
  name text not null,
  whatsapp text not null,
  created_at timestamptz default now(),
  unique(salon_id, whatsapp)
);

-- Agendamentos
create table if not exists appointments (
  id uuid primary key default uuid_generate_v4(),
  salon_id uuid references salons(id) on delete cascade,
  service_id uuid references services(id) on delete set null,
  client_id uuid references clients(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text check (status in ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED')),
  created_at timestamptz default now()
);

-- Pedidos de Produtos (Interesse)
create table if not exists product_orders (
  id uuid primary key default uuid_generate_v4(),
  salon_id uuid references salons(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  client_name text not null,
  client_phone text not null,
  status text check (status in ('PENDING', 'COMPLETED', 'CANCELLED')),
  created_at timestamptz default now()
);

-- Bloqueios
create table if not exists blocked_times (
  id uuid primary key default uuid_generate_v4(),
  salon_id uuid references salons(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  reason text,
  created_at timestamptz default now()
);

-- 3. VIEW PÚBLICA (CRUCIAL PARA O AGENDAMENTO)
create or replace view public_busy_times as
select 
  salon_id, 
  start_time, 
  end_time, 
  'appointment' as type 
from appointments 
where status != 'CANCELLED'
union all
select 
  salon_id, 
  start_time, 
  end_time, 
  'blocked' as type 
from blocked_times;

-- 4. STORAGE
insert into storage.buckets (id, name, public)
values ('salon-media', 'salon-media', true)
on conflict (id) do nothing;

-- 5. SEGURANÇA (RLS)

-- Habilitar RLS
alter table salons enable row level security;
alter table services enable row level security;
alter table products enable row level security;
alter table clients enable row level security;
alter table appointments enable row level security;
alter table blocked_times enable row level security;
alter table product_orders enable row level security;

-- Políticas de Leitura
drop policy if exists "Salons are public" on salons;
create policy "Salons are public" on salons for select using (true);

drop policy if exists "Services are public" on services;
create policy "Services are public" on services for select using (true);

drop policy if exists "Products are public" on products;
create policy "Products are public" on products for select using (true);

drop policy if exists "Busy times are public" on blocked_times;
create policy "Busy times are public" on blocked_times for select using (true); 

drop policy if exists "Public view appointments slots" on appointments;
create policy "Public view appointments slots" on appointments for select using (true);

-- Políticas de Escrita (Público)
drop policy if exists "Public create clients" on clients;
create policy "Public create clients" on clients for insert with check (true);

drop policy if exists "Public create appointments" on appointments;
create policy "Public create appointments" on appointments for insert with check (true);

drop policy if exists "Public create orders" on product_orders;
create policy "Public create orders" on product_orders for insert with check (true);

-- Políticas de ADMIN
drop policy if exists "Admin Full Access Salons" on salons;
create policy "Admin Full Access Salons" on salons for all using (auth.role() = 'authenticated');

drop policy if exists "Admin Full Access Services" on services;
create policy "Admin Full Access Services" on services for all using (auth.role() = 'authenticated');

drop policy if exists "Admin Full Access Products" on products;
create policy "Admin Full Access Products" on products for all using (auth.role() = 'authenticated');

drop policy if exists "Admin Full Access Clients" on clients;
create policy "Admin Full Access Clients" on clients for all using (auth.role() = 'authenticated');

drop policy if exists "Admin Full Access Appointments" on appointments;
create policy "Admin Full Access Appointments" on appointments for all using (auth.role() = 'authenticated');

drop policy if exists "Admin Full Access Blocks" on blocked_times;
create policy "Admin Full Access Blocks" on blocked_times for all using (auth.role() = 'authenticated');

drop policy if exists "Admin Full Access Orders" on product_orders;
create policy "Admin Full Access Orders" on product_orders for all using (auth.role() = 'authenticated');

-- Políticas de Storage
drop policy if exists "Public Access Storage" on storage.objects;
create policy "Public Access Storage" on storage.objects for select using ( bucket_id = 'salon-media' );

drop policy if exists "Admin Insert Storage" on storage.objects;
create policy "Admin Insert Storage" on storage.objects for insert with check ( bucket_id = 'salon-media' and auth.role() = 'authenticated' );

drop policy if exists "Admin Update Storage" on storage.objects;
create policy "Admin Update Storage" on storage.objects for update using ( bucket_id = 'salon-media' and auth.role() = 'authenticated' );

drop policy if exists "Admin Delete Storage" on storage.objects;
create policy "Admin Delete Storage" on storage.objects for delete using ( bucket_id = 'salon-media' and auth.role() = 'authenticated' );

-- 6. SEED DATA

-- Insere o Salão (Agora a tabela estará limpa e correta)
INSERT INTO salons (id, name, slug, phone, address, logo_url, opening_hours, subscription_status, owner_email)
VALUES (
  'e2c0a884-6d9e-4861-a9d5-17154238805f', 
  'Cílios de Luxo', 
  'cilios-de-luxo', 
  '11999999999', 
  'Rua F nº 143, Santa Mônica',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDyZu1A9B65hwLOA7DqdEmC2YsZaegwppquE_7UOU2hNkKa8h9EgPPxfmzh1cRWYJze9ad8I1GEgg5LswAjm4MUyJiFIz3FjroXYuA_HsJ99PIzxDrCDNgOX_qnsynkNAyRF1zPHTYj4iMd6k8dnrhiLK4TEpsTLIOk0sAku4K_nfNFLCOVBqEcNF_1e-Rl561XB5NwalEa5_d2pcoRiqbhIytoUmtK2OuK1fZAB4AQLk3YKJZyEq5t0oYd_4mzvUw4CipgSEH_eQ',
  '[
    {"dayOfWeek": 0, "isOpen": false, "slots": []},
    {"dayOfWeek": 1, "isOpen": true, "slots": [{"start": "09:00", "end": "12:00"}, {"start": "13:00", "end": "18:00"}]},
    {"dayOfWeek": 2, "isOpen": true, "slots": [{"start": "09:00", "end": "12:00"}, {"start": "13:00", "end": "18:00"}]},
    {"dayOfWeek": 3, "isOpen": true, "slots": [{"start": "09:00", "end": "12:00"}, {"start": "13:00", "end": "18:00"}]},
    {"dayOfWeek": 4, "isOpen": true, "slots": [{"start": "09:00", "end": "12:00"}, {"start": "13:00", "end": "18:00"}]},
    {"dayOfWeek": 5, "isOpen": true, "slots": [{"start": "09:00", "end": "12:00"}, {"start": "13:00", "end": "18:00"}]},
    {"dayOfWeek": 6, "isOpen": true, "slots": [{"start": "09:00", "end": "14:00"}]}
  ]'::jsonb,
  'TRIAL',
  'admin@cilios.com'
) ON CONFLICT (id) DO NOTHING;

-- Insere Serviços Iniciais
INSERT INTO services (salon_id, name, description, price, duration_min, image_url)
SELECT 
  'e2c0a884-6d9e-4861-a9d5-17154238805f', 
  'Volume Brasileiro', 
  'Técnica queridinha do momento. Fios em Y para volume e leveza.', 
  130.00, 
  105, 
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDyZu1A9B65hwLOA7DqdEmC2YsZaegwppquE_7UOU2hNkKa8h9EgPPxfmzh1cRWYJze9ad8I1GEgg5LswAjm4MUyJiFIz3FjroXYuA_HsJ99PIzxDrCDNgOX_qnsynkNAyRF1zPHTYj4iMd6k8dnrhiLK4TEpsTLIOk0sAku4K_nfNFLCOVBqEcNF_1e-Rl561XB5NwalEa5_d2pcoRiqbhIytoUmtK2OuK1fZAB4AQLk3YKJZyEq5t0oYd_4mzvUw4CipgSEH_eQ'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE salon_id = 'e2c0a884-6d9e-4861-a9d5-17154238805f' AND name = 'Volume Brasileiro');

INSERT INTO services (salon_id, name, description, price, duration_min, image_url)
SELECT 
  'e2c0a884-6d9e-4861-a9d5-17154238805f', 
  'Volume Russo', 
  'Olhar dramático e sofisticado com máxima densidade.', 
  150.00, 
  120, 
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDyZu1A9B65hwLOA7DqdEmC2YsZaegwppquE_7UOU2hNkKa8h9EgPPxfmzh1cRWYJze9ad8I1GEgg5LswAjm4MUyJiFIz3FjroXYuA_HsJ99PIzxDrCDNgOX_qnsynkNAyRF1zPHTYj4iMd6k8dnrhiLK4TEpsTLIOk0sAku4K_nfNFLCOVBqEcNF_1e-Rl561XB5NwalEa5_d2pcoRiqbhIytoUmtK2OuK1fZAB4AQLk3YKJZyEq5t0oYd_4mzvUw4CipgSEH_eQ'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE salon_id = 'e2c0a884-6d9e-4861-a9d5-17154238805f' AND name = 'Volume Russo');

INSERT INTO services (salon_id, name, description, price, duration_min, image_url)
SELECT 
  'e2c0a884-6d9e-4861-a9d5-17154238805f', 
  'Cílios Fio a Fio', 
  'Clássico para quem busca naturalidade e definição.', 
  110.00, 
  90, 
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDyZu1A9B65hwLOA7DqdEmC2YsZaegwppquE_7UOU2hNkKa8h9EgPPxfmzh1cRWYJze9ad8I1GEgg5LswAjm4MUyJiFIz3FjroXYuA_HsJ99PIzxDrCDNgOX_qnsynkNAyRF1zPHTYj4iMd6k8dnrhiLK4TEpsTLIOk0sAku4K_nfNFLCOVBqEcNF_1e-Rl561XB5NwalEa5_d2pcoRiqbhIytoUmtK2OuK1fZAB4AQLk3YKJZyEq5t0oYd_4mzvUw4CipgSEH_eQ'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE salon_id = 'e2c0a884-6d9e-4861-a9d5-17154238805f' AND name = 'Cílios Fio a Fio');

INSERT INTO services (salon_id, name, description, price, duration_min, image_url)
SELECT 
  'e2c0a884-6d9e-4861-a9d5-17154238805f', 
  'Manutenção', 
  'Manutenção de cílios para manter o volume e formato por mais tempo.', 
  80.00, 
  60, 
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDyZu1A9B65hwLOA7DqdEmC2YsZaegwppquE_7UOU2hNkKa8h9EgPPxfmzh1cRWYJze9ad8I1GEgg5LswAjm4MUyJiFIz3FjroXYuA_HsJ99PIzxDrCDNgOX_qnsynkNAyRF1zPHTYj4iMd6k8dnrhiLK4TEpsTLIOk0sAku4K_nfNFLCOVBqEcNF_1e-Rl561XB5NwalEa5_d2pcoRiqbhIytoUmtK2OuK1fZAB4AQLk3YKJZyEq5t0oYd_4mzvUw4CipgSEH_eQ'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE salon_id = 'e2c0a884-6d9e-4861-a9d5-17154238805f' AND name = 'Manutenção');
