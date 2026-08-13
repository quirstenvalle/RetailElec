-- Admin settings — store configuration (singleton row)
-- Project: jpunedofchmqquxrntls

create table if not exists public.store_settings (
  id int primary key default 1 check (id = 1),
  store_name text not null default 'Quinto Store',
  contact_email text,
  contact_phone text,
  address text,
  notify_new_orders boolean not null default true,
  notify_low_stock boolean not null default true,
  notify_cancellations boolean not null default true,
  sidebar_open_default boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

insert into public.store_settings (
  id,
  store_name,
  contact_email,
  contact_phone,
  address
)
values (
  1,
  'Quinto Store',
  'admin@quinto.store',
  '',
  ''
)
on conflict (id) do nothing;

alter table public.store_settings enable row level security;

drop policy if exists "store_settings_select_admin" on public.store_settings;
create policy "store_settings_select_admin"
  on public.store_settings for select
  to authenticated
  using (public.is_admin());

drop policy if exists "store_settings_update_admin" on public.store_settings;
create policy "store_settings_update_admin"
  on public.store_settings for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "store_settings_insert_admin" on public.store_settings;
create policy "store_settings_insert_admin"
  on public.store_settings for insert
  to authenticated
  with check (public.is_admin());
