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

-- 5. Token Kullanim Analitigi
create table if not exists token_usage (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references auth.users on delete cascade,
  feature_name text not null,
  model_id     text not null,
  prompt_tokens int not null,
  completion_tokens int not null,
  total_tokens int not null,
  created_at   timestamptz default now()
);

alter table token_usage enable row level security;

drop policy if exists "Own token usage" on token_usage;
create policy "Users can view own token usage"   on token_usage for select using (auth.uid() = user_id);
create policy "Users can insert own token usage" on token_usage for insert with check (auth.uid() = user_id);

-- ============================================================
-- 6. Profile & Auth Epic v1 - Schema Extensions
-- ============================================================

-- Add new columns to existing profiles table
alter table profiles add column if not exists email text;
alter table profiles add column if not exists chart_updates_remaining integer default 1;
alter table profiles add column if not exists chart_last_updated_at timestamptz;
alter table profiles add column if not exists wp_user_id integer;
alter table profiles add column if not exists wp_linked_at timestamptz;
alter table profiles add column if not exists migrated_from_guest boolean default false;
alter table profiles add column if not exists guest_migrated_at timestamptz;

-- Otomatik profil oluşturma (kayıt olunca)
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$ language plpgsql security definer;

-- Mevcut trigger'ı düşür ve yeniden oluştur (hata almamak için)
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
