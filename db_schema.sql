-- ATIVE EXTENSÕES NECESSÁRIAS
create extension if not exists "uuid-ossp";

-- 1. TABELA DE SALÕES (Configurações Gerais)
create table if not exists salons (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  logo_url text,
  phone text,
  address text,
  theme_color text,
  opening_hours jsonb default '[]'::jsonb, -- Armazena o array DaySchedule
  created_at timestamptz default now()
);

-- 2. TABELA DE SERVIÇOS
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

-- 3. TABELA DE PRODUTOS (Inventário)
create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  salon_id uuid references salons(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10,2) not null,
  stock integer default 0,
  created_at timestamptz default now()
);

-- 4. TABELA DE CLIENTES
create table if not exists clients (
  id uuid primary key default uuid_generate_v4(),
  salon_id uuid references salons(id) on delete cascade,
  name text not null,
  whatsapp text not null,
  created_at timestamptz default now(),
  unique(salon_id, whatsapp) -- Evita duplicidade de cliente no mesmo salão
);

-- 5. TABELA DE AGENDAMENTOS
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

-- 6. TABELA DE BLOQUEIOS DE AGENDA (Feriados, Almoço, etc)
create table if not exists blocked_times (
  id uuid primary key default uuid_generate_v4(),
  salon_id uuid references salons(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  reason text,
  created_at timestamptz default now()
);

-- 7. VIEW PÚBLICA DE HORÁRIOS OCUPADOS (ESSENCIAL PARA O BOOKING.TSX)
-- Esta view combina agendamentos e bloqueios para que o frontend saiba
-- o que está ocupado sem precisar ler dados sensíveis dos clientes.
-- DROP primeiro para evitar erros de conflito de colunas ao atualizar
DROP VIEW IF EXISTS public_busy_times;

create view public_busy_times as
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

-- POLÍTICAS DE SEGURANÇA (RLS)
-- Habilitar RLS (não falha se já estiver habilitado)
alter table salons enable row level security;
alter table services enable row level security;
alter table products enable row level security;
alter table clients enable row level security;
alter table appointments enable row level security;
alter table blocked_times enable row level security;

-- Recriar Políticas para evitar erros de duplicidade
-- Drop policies if exist
drop policy if exists "Salons are public" on salons;
drop policy if exists "Services are public" on services;
drop policy if exists "Busy times are public" on blocked_times;
drop policy if exists "Clients can be created publicly" on clients;
drop policy if exists "Appointments can be created publicly" on appointments;
drop policy if exists "Admins can do everything" on salons;
drop policy if exists "Admins can do everything services" on services;
drop policy if exists "Admins can do everything products" on products;
drop policy if exists "Admins can do everything clients" on clients;
drop policy if exists "Admins can do everything appointments" on appointments;
drop policy if exists "Admins can do everything blocked_times" on blocked_times;

-- Políticas de Leitura Pública
create policy "Salons are public" on salons for select using (true);
create policy "Services are public" on services for select using (true);
create policy "Busy times are public" on blocked_times for select using (true);

-- Permitir criação pública (para agendar)
create policy "Clients can be created publicly" on clients for insert with check (true);
create policy "Appointments can be created publicly" on appointments for insert with check (true);

-- Para o Admin (Permissão total se estiver logado)
create policy "Admins can do everything" on salons for all using (auth.role() = 'authenticated');
create policy "Admins can do everything services" on services for all using (auth.role() = 'authenticated');
create policy "Admins can do everything products" on products for all using (auth.role() = 'authenticated');
create policy "Admins can do everything clients" on clients for all using (auth.role() = 'authenticated');
create policy "Admins can do everything appointments" on appointments for all using (auth.role() = 'authenticated');
create policy "Admins can do everything blocked_times" on blocked_times for all using (auth.role() = 'authenticated');

-- DADOS INICIAIS (SEED)
-- Usa ON CONFLICT para não falhar se já existir
INSERT INTO salons (id, name, slug, phone, address, logo_url, opening_hours)
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
  ]'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Insere Serviços Iniciais (apenas se não existirem para este salão)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM services WHERE salon_id = 'e2c0a884-6d9e-4861-a9d5-17154238805f') THEN
    INSERT INTO services (salon_id, name, description, price, duration_min, image_url)
    VALUES 
    ('e2c0a884-6d9e-4861-a9d5-17154238805f', 'Volume Brasileiro', 'Técnica queridinha do momento. Fios em Y para volume e leveza.', 130.00, 105, 'https://picsum.photos/400?1'),
    ('e2c0a884-6d9e-4861-a9d5-17154238805f', 'Volume Russo', 'Olhar dramático e sofisticado com máxima densidade.', 150.00, 120, 'https://picsum.photos/400?2'),
    ('e2c0a884-6d9e-4861-a9d5-17154238805f', 'Cílios Fio a Fio', 'Clássico para quem busca naturalidade e definição.', 110.00, 90, 'https://picsum.photos/400?3');
  END IF;
END $$;