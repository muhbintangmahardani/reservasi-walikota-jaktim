-- ==============================================================================
-- SISTEM E-RESERVASI RUANG RAPAT & FASILITAS KANTOR WALIKOTA JAKARTA TIMUR
-- Skema Database PostgreSQL / Supabase Migration
-- Versi: 1.1.0
-- ==============================================================================

-- 1. Enable Extension
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 2. ENUM & Types
do $$ begin
  create type user_role_enum as enum ('user_bagian', 'verifikator_asisten', 'verifikator_pimpinan', 'admin');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type user_type_enum as enum ('internal', 'eksternal');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type reservation_status_enum as enum ('menunggu', 'disetujui', 'ditolak');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type notif_type_enum as enum ('info', 'success', 'warning', 'error');
exception
  when duplicate_object then null;
end $$;

-- 3. Tabel Profiles (Mendukung Auth Supabase & Manajemen Pengguna Langsung)
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  unit_name text not null,
  role user_role_enum not null default 'user_bagian',
  user_type user_type_enum not null default 'internal',
  email text not null,
  phone_number text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index profil
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_email on public.profiles(email);

-- Trigger untuk sinkronisasi otomatis ketika user mendaftar via auth.users Supabase
create or replace function public.handle_new_auth_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, unit_name, role, user_type, email, phone_number)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'unit_name', 'Bagian Umum dan Protokol'),
    coalesce((new.raw_user_meta_data->>'role')::user_role_enum, 'user_bagian'),
    coalesce((new.raw_user_meta_data->>'user_type')::user_type_enum, 'internal'),
    new.email,
    new.raw_user_meta_data->>'phone_number'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();

-- 4. Tabel Master Ruangan (Rooms)
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  building_floor text not null,
  capacity int not null default 0,
  facilities text[] not null default '{}',
  is_active boolean not null default true,
  image_url text,
  description text,
  created_at timestamptz not null default now()
);

-- 5. Tabel Kategori Agenda (Categories)
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color_code text not null default '#1e40af',
  description text,
  created_at timestamptz not null default now()
);

-- 6. Tabel Kontak PIC Bidang (PIC Contacts)
create table if not exists public.pic_contacts (
  id uuid primary key default gen_random_uuid(),
  sector_name text not null,
  pic_name text not null,
  whatsapp_number text not null,
  email text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 7. Tabel Reservasi (Reservations)
create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  custom_room_name text,
  event_name text not null,
  event_date date not null,
  start_time time not null,
  end_time time not null,
  executor_official text not null,
  accompanying_official text,
  dress_code text not null default 'Pakaian Dinas Harian (PDH)',
  letter_origin text not null,
  category_id uuid references public.categories(id) on delete set null,
  status reservation_status_enum not null default 'menunggu',
  rejection_reason text,
  verified_by uuid references public.profiles(id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes untuk kueri cepat kalender & cek bentrok
create index if not exists idx_reservations_calendar on public.reservations(event_date, status, room_id);
create index if not exists idx_reservations_user on public.reservations(user_id);
create index if not exists idx_reservations_status on public.reservations(status);

-- 8. Tabel Notifikasi Internal (Notifications)
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  reservation_id uuid references public.reservations(id) on delete cascade,
  title text not null,
  message text not null,
  type notif_type_enum not null default 'info',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_recipient on public.notifications(recipient_id, is_read);

-- 9. Tabel Log Audit Trail (Audit Logs)
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid references public.reservations(id) on delete set null,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  changed_fields jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- 10. Database Function: Deteksi Konflik Irisan Jadwal (Anti Double-Booking)
create or replace function public.check_reservation_conflict(
  p_room_id uuid,
  p_event_date date,
  p_start_time time,
  p_end_time time,
  p_exclude_id uuid default null
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_conflict_count int;
begin
  if p_room_id is null then
    return false;
  end if;

  select count(*)
  into v_conflict_count
  from public.reservations
  where room_id = p_room_id
    and event_date = p_event_date
    and status = 'disetujui'
    and (p_exclude_id is null or id <> p_exclude_id)
    and (start_time < p_end_time and end_time > p_start_time);

  return (v_conflict_count > 0);
end;
$$;

-- 11. Row Level Security (RLS) Policies
alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.categories enable row level security;
alter table public.pic_contacts enable row level security;
alter table public.reservations enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

-- PROFILES: Semua pengguna dapat membaca profil pembuat agenda (transparansi kalender)
create policy "Allow read profiles" on public.profiles
  for select using (true);

create policy "Allow insert/update profiles" on public.profiles
  for all using (true) with check (true);

-- ROOMS: Semua pengguna dapat melihat ruangan, admin dapat mengelola
create policy "Allow read rooms" on public.rooms
  for select using (true);

create policy "Allow manage rooms" on public.rooms
  for all using (true) with check (true);

-- CATEGORIES: Semua pengguna dapat melihat kategori label
create policy "Allow read categories" on public.categories
  for select using (true);

create policy "Allow manage categories" on public.categories
  for all using (true) with check (true);

-- PIC CONTACTS: Kontak PIC bidang transparan bagi seluruh staf
create policy "Allow read pic_contacts" on public.pic_contacts
  for select using (true);

create policy "Allow manage pic_contacts" on public.pic_contacts
  for all using (true) with check (true);

-- RESERVATIONS: Semua jadwal transparan (prinsip e-reservasi pemkot)
create policy "Allow read reservations" on public.reservations
  for select using (true);

create policy "Allow insert reservations" on public.reservations
  for insert with check (true);

create policy "Allow update reservations" on public.reservations
  for update using (true);

create policy "Allow delete reservations" on public.reservations
  for delete using (true);

-- NOTIFICATIONS: Notifikasi internal
create policy "Allow read notifications" on public.notifications
  for select using (true);

create policy "Allow insert notifications" on public.notifications
  for insert with check (true);

create policy "Allow update notifications" on public.notifications
  for update using (true);

-- AUDIT LOGS: Log riwayat aktivitas
create policy "Allow read audit_logs" on public.audit_logs
  for select using (true);

create policy "Allow insert audit_logs" on public.audit_logs
  for insert with check (true);

-- 12. Enable Realtime Publications
-- Mengaktifkan pengiriman event real-time ke web clients saat ada insert/update/delete
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table 
    public.reservations, 
    public.notifications,
    public.rooms,
    public.categories;
commit;

