-- ==========================================================================
-- 为什么中文 · SECURITY PATCH v2 — แก้ recursive + ปิดช่องโหว่ (รันทั้งบล็อกนี้)
-- ==========================================================================

-- 0) ฟังก์ชันตรวจแอดมิน (security definer → ไม่วน recursive)
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

-- 1) profiles: อ่านได้เฉพาะเจ้าของตัวเอง + แอดมิน
drop policy if exists "profiles_read" on public.profiles;
create policy "profiles_read" on public.profiles for select
  using (auth.uid() = id or public.is_admin());

-- 2) profiles: อัปเดต/สร้างได้เฉพาะตัวเอง (หรือแอดมิน)
drop policy if exists "profiles_own_update" on public.profiles;
create policy "profiles_own_update" on public.profiles for update
  using (auth.uid() = id or public.is_admin());
drop policy if exists "profiles_own_insert" on public.profiles;
create policy "profiles_own_insert" on public.profiles for insert
  with check (auth.uid() = id);

-- 3) site_config: ทุกคนอ่านได้ แอดมินเท่านั้นที่แก้ได้
drop policy if exists "config_read" on public.site_config;
create policy "config_read" on public.site_config for select using (true);
drop policy if exists "config_admin_update" on public.site_config;
create policy "config_admin_update" on public.site_config for update using (public.is_admin());
drop policy if exists "config_admin_insert" on public.site_config;
create policy "config_admin_insert" on public.site_config for insert with check (public.is_admin());

-- 4) payments: ดู/สร้างของตัวเอง — แอดมินดู+แก้ได้ทั้งหมด
drop policy if exists "payments_read_own" on public.payments;
create policy "payments_read_own" on public.payments for select
  using (auth.uid() = user_id or public.is_admin());
drop policy if exists "payments_insert_own" on public.payments;
create policy "payments_insert_own" on public.payments for insert
  with check (auth.uid() = user_id);
drop policy if exists "payments_admin_update" on public.payments;
create policy "payments_admin_update" on public.payments for update
  using (public.is_admin());

-- 5) กันผู้ใช้ทั่วไปแก้ is_admin/เหรียญ/พรีเมียมของตัวเอง
create or replace function public.protect_sensitive()
returns trigger language plpgsql security definer set search_path = public as $$
declare is_adm boolean;
begin
  select public.is_admin() into is_adm;
  if not is_adm then
    if new.is_admin is distinct from old.is_admin
       or new.weiqian  is distinct from old.weiqian
       or new.premium_plan is distinct from old.premium_plan
       or new.premium_until is distinct from old.premium_until then
      raise exception 'ไม่มีสิทธิ์แก้ข้อมูลนี้';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists protect_sensitive on public.profiles;
create trigger protect_sensitive before update on public.profiles
  for each row execute function public.protect_sensitive();
