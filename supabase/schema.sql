-- ============================================================
-- PET (Pera Enerji Takvimi) - Supabase Database Schema
-- Supabase > SQL Editor > New Query > Yapistir ve Calistir
-- ============================================================

-- 1. Kullanici profilleri
create table if not exists profiles (
  id         uuid references auth.users on delete cascade primary key,
  first_name text,
  last_name  text,
  birth_date text,
  birth_time text,
  birth_place text,
  birth_lat  float,
  birth_lng  float,
  created_at timestamptz default now()
);

-- 2. Zikir oturumlari (her kullanici x her esma icin bir satir)
create table if not exists zikir_sessions (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users on delete cascade not null,
  esma_id    text not null,
  count      integer default 0,
  updated_at timestamptz default now(),
  unique(user_id, esma_id)
);

-- 3. Row Level Security aç
alter table profiles       enable row level security;
alter table zikir_sessions enable row level security;

-- 4. Her kullanici sadece kendi verisini okuyup yazabilsin
create policy "Own profile"  on profiles       for all using (auth.uid() = id);
create policy "Own sessions" on zikir_sessions for all using (auth.uid() = user_id);
