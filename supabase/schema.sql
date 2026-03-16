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
  avatar_url text,
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

-- 4. Politikalar
-- Profiles
drop policy if exists "Own profile" on profiles;
create policy "Users can view own profile"   on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- Sessions
drop policy if exists "Own sessions" on zikir_sessions;
create policy "Users can view own sessions"   on zikir_sessions for select using (auth.uid() = user_id);
create policy "Users can update own sessions" on zikir_sessions for update using (auth.uid() = user_id);
create policy "Users can insert own sessions" on zikir_sessions for insert with check (auth.uid() = user_id);

