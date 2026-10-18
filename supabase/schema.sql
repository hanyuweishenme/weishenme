-- ==========================================================================
-- 为什么中文 · Supabase schema — users + realtime config
-- รันใน SQL Editor ของ Supabase (Dashboard → SQL → New query → Run)
-- ==========================================================================

-- 1. โปรไฟล์ผู้ใช้ (สอดคล้องกับระบบผู้ใช้ของเว็บ)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  name text not null default '',
  avatar text default '龍',
  birthday text,
  xp integer default 0,
  points integer default 0,
  hp integer default 5,
  streak integer default 0,
  premium_plan text,              -- m1 / m6 / life / null
  premium_until text,             -- timestamp ms (string เพื่อกัน precision)
  weiqian integer default 0,
  tythemes text[] default '{}',   -- ธีมที่ปลดล็อก
  typing_stage integer default 0,
  typing_stars jsonb default '{}',
  progress jsonb default '{}',    -- read/gameStars/exams/curriculum
  is_admin boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. คำขอชำระเงิน (พรีเมียม/เหรียญ) — ผู้ใช้แจ้ง แอดมินยืนยัน
create table if not exists public.payments (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  kind text not null,             -- 'premium' | 'coins'
  plan_id text,
  amount_baht integer,
  ref text,
  status text default 'pending',  -- pending / approved / rejected
  note text,
  created_at timestamptz default now()
);

-- 3. ตั้งค่าเว็บแบบเรียลไทม์ (feature toggles ฯลฯ) — แอดมินแก้ → ทุกคนเห็นทันที
create table if not exists public.site_config (
  key text primary key,
  value jsonb not null default '{}',
  updated_at timestamptz default now()
);
insert into public.site_config (key, value) values
  ('features', '{}'),
  ('itemCfg',  '{"articles":{},"games":{}}'),
  ('settings', '{}')
on conflict (key) do nothing;

-- 4. Realtime: เปิด broadcast การเปลี่ยนแปลงของ site_config
alter table public.site_config replica identity full;
do $$ begin
  create publication supabase_realtime_config for table public.site_config;
exception when duplicate_object then null; end $$;

-- 5. RLS — ผู้ใช้ทุกคนอ่านได้ เฉพาะเจ้าของ/แอดมินแก้ได้
alter table public.profiles enable row level security;
alter table public.site_config enable row level security;
alter table public.payments enable row level security;

-- 5b. สิทธิ์พื้นฐาน (Supabase รุ่นใหม่ไม่ grant ให้อัตโนมัติ — จำเป็น!)
grant usage on schema public to anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;
grant select on public.site_config to anon, authenticated;
grant select, insert, update on public.payments to authenticated;

drop policy if exists "profiles_read" on public.profiles;
create policy "profiles_read" on public.profiles for select using (true);
drop policy if exists "profiles_own_update" on public.profiles;
create policy "profiles_own_update" on public.profiles for update
  using (auth.uid() = id or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));
drop policy if exists "profiles_own_insert" on public.profiles;
create policy "profiles_own_insert" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "config_read" on public.site_config;
create policy "config_read" on public.site_config for select using (true);
drop policy if exists "config_admin_update" on public.site_config;
create policy "config_admin_update" on public.site_config for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));
drop policy if exists "config_admin_insert" on public.site_config;
create policy "config_admin_insert" on public.site_config for insert
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

drop policy if exists "payments_read_own" on public.payments;
create policy "payments_read_own" on public.payments for select
  using (auth.uid() = user_id or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));
drop policy if exists "payments_insert_own" on public.payments;
create policy "payments_insert_own" on public.payments for insert with check (auth.uid() = user_id);
drop policy if exists "payments_admin_update" on public.payments;
create policy "payments_admin_update" on public.payments for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- 6. ฟังก์ชัน: สร้างโปรไฟล์อัตโนมัติหลังสมัคร
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name','ผู้เรียน'));
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- 7. หลังสร้างโปรเจกต์: ตั้งแอดมินคนแรก (สมัครผู้ดูแลในเว็บก่อน แล้วรันคำสั่งนี้)
-- update public.profiles set is_admin = true where email = 'คุณ@example.com';
