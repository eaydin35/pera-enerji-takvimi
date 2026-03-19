-- ai_cache tablosu: Token ekonomisi için AI sonuçlarının saklanması
create table ai_cache (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users not null,
    cache_key text not null,
    payload jsonb not null,
    payload_hash text not null,
    created_at timestamptz default now(),
    expires_at timestamptz,
    version integer default 1,
    constraint unique_user_key unique (user_id, cache_key)
);

alter table ai_cache enable row level security;
create policy "user_own_cache" on ai_cache for all using (user_id = auth.uid());

-- index: key bazli hizli sorgu
create index idx_ai_cache_key on ai_cache(user_id, cache_key);
create index idx_ai_cache_expiry on ai_cache(expires_at) where expires_at is not null;

-- notification_log tablosu: Hangi bildirimlerin çalışıp çalışmadığını analiz etmek için
create table notification_log (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users not null,
    hook_type text not null,
    delivery_slot text not null,   -- morning|midday|evening|weekly|event
    trigger_condition text,
    sent_at timestamptz default now(),
    opened_at timestamptz,         -- null ise acilmadi
    open_to_session_seconds int    -- acildiktan kac saniye sonra kapatti
);

alter table notification_log enable row level security;
create policy "user_own_notifications" on notification_log for all using (user_id = auth.uid());

-- user_streaks tablosu: Uygulama içi tutunma (retention) için
create table user_streaks (
    user_id uuid primary key references auth.users not null,
    app_open_streak integer default 0,
    esma_streak integer default 0,
    last_app_open date,
    last_esma_complete date,
    updated_at timestamptz default now()
);

alter table user_streaks enable row level security;
create policy "user_own_streaks" on user_streaks for all using (user_id = auth.uid());
