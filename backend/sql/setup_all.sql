-- Arlen's Store â€” schema
-- Project: jpunedofchmqquxrntls
-- Run in Supabase SQL Editor (in order: 01 â†’ 02 â†’ 03)

create extension if not exists "pgcrypto";

create sequence if not exists public.customer_id_seq start 100;
create sequence if not exists public.product_id_seq start 100;
create sequence if not exists public.order_number_seq start 100;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  name text not null,
  role text not null default 'customer' check (role in ('admin', 'customer')),
  phone text,
  business_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id serial primary key,
  name text not null unique,
  sort_order int not null default 0
);

create table if not exists public.products (
  id text primary key,
  name text not null,
  category text not null references public.categories (name) on update cascade,
  display_category text not null,
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  piece_price numeric(12, 2) not null check (piece_price >= 0),
  pack_label text not null default '1 box',
  unit_weight text not null default 'N/A',
  stock int not null default 0 check (stock >= 0),
  image_path text not null,
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.customers (
  id text primary key,
  user_id uuid unique references public.profiles (id) on delete set null,
  name text not null,
  email text not null unique,
  phone text not null,
  last_transaction text not null default 'No transaction yet',
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  receipt_id text not null unique,
  customer_id text references public.customers (id) on delete set null,
  customer_name text not null,
  customer_email text,
  status text not null default 'Pending'
    check (status in ('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled')),
  delivery_mode text,
  payment_mode text,
  total numeric(12, 2) not null default 0 check (total >= 0),
  order_date text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id text references public.products (id) on delete set null,
  name text not null,
  category text,
  display_category text,
  unit_price numeric(12, 2) not null,
  piece_price numeric(12, 2),
  pack_label text,
  unit_weight text,
  image_path text,
  quantity int not null check (quantity > 0)
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_id text not null references public.products (id) on delete cascade,
  quantity int not null check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create index if not exists products_category_idx on public.products (category);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_customer_email_idx on public.orders (customer_email);
create index if not exists cart_items_user_idx on public.cart_items (user_id);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_role text;
  v_phone text;
  v_business text;
  v_address text;
  v_city text;
  v_province text;
  v_postal text;
  v_customer_id text;
begin
  v_name := coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1), 'User');
  v_role := coalesce(new.raw_app_meta_data ->> 'role', 'customer');
  if v_role not in ('admin', 'customer') then
    v_role := 'customer';
  end if;
  v_phone := coalesce(new.raw_user_meta_data ->> 'phone', '');
  v_business := coalesce(new.raw_user_meta_data ->> 'business_name', '');
  v_address := coalesce(new.raw_user_meta_data ->> 'delivery_address', '');
  v_city := coalesce(new.raw_user_meta_data ->> 'delivery_city', '');
  v_province := coalesce(new.raw_user_meta_data ->> 'delivery_province', '');
  v_postal := coalesce(new.raw_user_meta_data ->> 'delivery_postal_code', '');

  insert into public.profiles (
    id, email, name, role, phone, business_name,
    delivery_address, delivery_city, delivery_province, delivery_postal_code
  )
  values (
    new.id,
    lower(new.email),
    v_name,
    v_role,
    nullif(v_phone, ''),
    nullif(v_business, ''),
    nullif(v_address, ''),
    nullif(v_city, ''),
    nullif(v_province, ''),
    nullif(v_postal, '')
  )
  on conflict (id) do update
    set email = excluded.email,
        name = excluded.name,
        phone = coalesce(excluded.phone, public.profiles.phone),
        business_name = coalesce(excluded.business_name, public.profiles.business_name),
        delivery_address = coalesce(excluded.delivery_address, public.profiles.delivery_address),
        delivery_city = coalesce(excluded.delivery_city, public.profiles.delivery_city),
        delivery_province = coalesce(excluded.delivery_province, public.profiles.delivery_province),
        delivery_postal_code = coalesce(excluded.delivery_postal_code, public.profiles.delivery_postal_code);

  if v_role = 'customer' then
    select id into v_customer_id from public.customers where email = lower(new.email);
    if v_customer_id is null then
      v_customer_id := 'c-' || lpad(nextval('public.customer_id_seq')::text, 3, '0');
      insert into public.customers (id, user_id, name, email, phone)
      values (
        v_customer_id,
        new.id,
        v_name,
        lower(new.email),
        coalesce(nullif(v_phone, ''), 'N/A')
      );
    else
      update public.customers
      set user_id = new.id,
          name = v_name,
          phone = coalesce(nullif(v_phone, ''), phone)
      where id = v_customer_id;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.next_product_id()
returns text
language sql
as $$
  select 'w-' || lpad(nextval('public.product_id_seq')::text, 3, '0');
$$;

create or replace function public.next_customer_id()
returns text
language sql
as $$
  select 'c-' || lpad(nextval('public.customer_id_seq')::text, 3, '0');
$$;

create or replace function public.next_order_number()
returns text
language sql
as $$
  select 'ORD ' || lpad(nextval('public.order_number_seq')::text, 3, '0');
$$;

grant usage on schema public to anon, authenticated, service_role;
grant select on public.categories to anon, authenticated;
grant select on public.products to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.customers to authenticated;
grant select, insert, update, delete on public.orders to authenticated;
grant select, insert, update, delete on public.order_items to authenticated;
grant select, insert, update, delete on public.cart_items to authenticated;
grant select, insert, update, delete on public.products to authenticated;
grant select, insert, update, delete on public.categories to authenticated;
grant usage, select on all sequences in schema public to authenticated, service_role;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.next_product_id() to authenticated;
grant execute on function public.next_customer_id() to authenticated;
grant execute on function public.next_order_number() to authenticated;
-- Arlen's Store â€” Row Level Security
-- Project: jpunedofchmqquxrntls

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.cart_items enable row level security;

-- Profiles
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

-- Categories / products (catalog is readable by everyone with a session; write = admin)
drop policy if exists "categories_select_all" on public.categories;
create policy "categories_select_all"
  on public.categories for select
  to authenticated
  using (true);

drop policy if exists "categories_admin_write" on public.categories;
create policy "categories_admin_write"
  on public.categories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "products_select_all" on public.products;
create policy "products_select_all"
  on public.products for select
  to authenticated
  using (true);

drop policy if exists "products_admin_insert" on public.products;
create policy "products_admin_insert"
  on public.products for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "products_admin_update" on public.products;
create policy "products_admin_update"
  on public.products for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "products_admin_delete" on public.products;
create policy "products_admin_delete"
  on public.products for delete
  to authenticated
  using (public.is_admin());

-- Customers
drop policy if exists "customers_admin_all" on public.customers;
create policy "customers_admin_all"
  on public.customers for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "customers_select_own" on public.customers;
create policy "customers_select_own"
  on public.customers for select
  to authenticated
  using (user_id = auth.uid());

-- Orders
drop policy if exists "orders_admin_all" on public.orders;
create policy "orders_admin_all"
  on public.orders for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "orders_customer_select" on public.orders;
create policy "orders_customer_select"
  on public.orders for select
  to authenticated
  using (customer_email = (select email from public.profiles where id = auth.uid()));

drop policy if exists "orders_customer_insert" on public.orders;
create policy "orders_customer_insert"
  on public.orders for insert
  to authenticated
  with check (
    customer_email = (select email from public.profiles where id = auth.uid())
    and not public.is_admin()
  );

-- Order items
drop policy if exists "order_items_admin_all" on public.order_items;
create policy "order_items_admin_all"
  on public.order_items for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "order_items_customer_select" on public.order_items;
create policy "order_items_customer_select"
  on public.order_items for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and o.customer_email = (select email from public.profiles where id = auth.uid())
    )
  );

drop policy if exists "order_items_customer_insert" on public.order_items;
create policy "order_items_customer_insert"
  on public.order_items for insert
  to authenticated
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and o.customer_email = (select email from public.profiles where id = auth.uid())
    )
  );

-- Cart
drop policy if exists "cart_own_all" on public.cart_items;
create policy "cart_own_all"
  on public.cart_items for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
-- Categories + login accounts only (no sample catalog/orders/customers)
-- Demo logins kept intentionally:
--   admin@arlen.store / admin123
--   customer@arlen.store / customer123

insert into public.categories (name, sort_order) values
  ('Laundry Care', 1),
  ('Canned Goods', 2),
  ('Dry Materials', 3),
  ('Beverages', 4),
  ('Snacks', 5)
on conflict (name) do nothing;

do $$
declare
  admin_id uuid := '11111111-1111-1111-1111-111111111111';
  customer_id uuid := '22222222-2222-2222-2222-222222222222';
begin
  if not exists (select 1 from auth.users where email = 'admin@arlen.store') then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000',
      admin_id,
      'authenticated',
      'authenticated',
      'admin@arlen.store',
      crypt('admin123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"],"role":"admin"}'::jsonb,
      '{"name":"Store Admin"}'::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    insert into auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) values (
      admin_id,
      admin_id,
      format('{"sub":"%s","email":"admin@arlen.store"}', admin_id)::jsonb,
      'email',
      admin_id::text,
      now(),
      now(),
      now()
    );
  end if;

  if not exists (select 1 from auth.users where email = 'customer@arlen.store') then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000',
      customer_id,
      'authenticated',
      'authenticated',
      'customer@arlen.store',
      crypt('customer123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"],"role":"customer"}'::jsonb,
      '{"name":"Juan Dela Cruz","phone":"0912-345-6789"}'::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    insert into auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) values (
      customer_id,
      customer_id,
      format('{"sub":"%s","email":"customer@arlen.store"}', customer_id)::jsonb,
      'email',
      customer_id::text,
      now(),
      now(),
      now()
    );
  end if;

  update public.profiles
  set role = 'admin', name = 'Store Admin'
  where email = 'admin@arlen.store';

  update public.profiles
  set role = 'customer', name = 'Juan Dela Cruz', phone = '0912-345-6789'
  where email = 'customer@arlen.store';
end $$;
-- Payments support (also applied remotely)
alter table public.orders
  add column if not exists payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'awaiting_payment', 'paid', 'failed', 'refunded')),
  add column if not exists paymongo_checkout_id text,
  add column if not exists paymongo_payment_id text,
  add column if not exists paid_at timestamptz;

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'awaiting_payment'
    check (status in ('awaiting_payment', 'paid', 'failed', 'cancelled', 'expired')),
  mode text not null default 'demo' check (mode in ('demo', 'paymongo')),
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'PHP',
  delivery_mode text not null,
  payment_mode text not null default 'online',
  cart_snapshot jsonb not null,
  paymongo_checkout_id text,
  paymongo_payment_id text,
  checkout_url text,
  order_id uuid references public.orders (id) on delete set null,
  reference_number text not null unique,
  error_message text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists payments_user_idx on public.payments (user_id);
create index if not exists payments_checkout_idx on public.payments (paymongo_checkout_id);

alter table public.payments enable row level security;

drop policy if exists "payments_select_own_or_admin" on public.payments;
create policy "payments_select_own_or_admin"
  on public.payments for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "payments_insert_own" on public.payments;
create policy "payments_insert_own"
  on public.payments for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "payments_update_own" on public.payments;
create policy "payments_update_own"
  on public.payments for update
  to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

grant select, insert, update on public.payments to authenticated;
-- Notifications helpers (applied remotely)
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null default '',
  type text not null default 'info'
    check (type in ('info', 'order', 'payment', 'system')),
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- Admin settings — store configuration (singleton row)
-- Project: jpunedofchmqquxrntls

create table if not exists public.store_settings (
  id int primary key default 1 check (id = 1),
  store_name text not null default 'Arlen''s Store',
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
  'Arlen''s Store',
  'admin@arlen.store',
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
-- Order shipment fields
alter table public.orders
  add column if not exists shipping_carrier text,
  add column if not exists tracking_number text,
  add column if not exists shipped_at date,
  add column if not exists shipping_fee numeric(12, 2) not null default 0 check (shipping_fee >= 0);
-- Cart / order pricing unit (box vs piece)
alter table public.cart_items
  add column if not exists pricing_unit text not null default 'box'
    check (pricing_unit in ('box', 'piece'));

alter table public.order_items
  add column if not exists pricing_unit text not null default 'box'
    check (pricing_unit in ('box', 'piece'));

alter table public.cart_items drop constraint if exists cart_items_user_id_product_id_key;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'cart_items_user_product_unit_key'
  ) then
    alter table public.cart_items
      add constraint cart_items_user_product_unit_key unique (user_id, product_id, pricing_unit);
  end if;
end $$;

-- Customer delivery address
alter table public.profiles
  add column if not exists delivery_address text,
  add column if not exists delivery_city text,
  add column if not exists delivery_province text,
  add column if not exists delivery_postal_code text;

alter table public.orders
  add column if not exists shipping_address text,
  add column if not exists shipping_city text,
  add column if not exists shipping_province text,
  add column if not exists shipping_postal_code text;

alter table public.payments
  add column if not exists shipping_snapshot jsonb;

-- Auto-decrement product stock when an order succeeds
alter table public.orders
  add column if not exists stock_applied boolean not null default false;

create or replace function public.decrement_stock_for_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  updated_rows int;
  applied boolean;
begin
  if p_order_id is null then
    raise exception 'Order id is required';
  end if;

  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_admin() then
    if not exists (
      select 1
      from public.orders o
      where o.id = p_order_id
        and o.customer_email = (select email from public.profiles where id = auth.uid())
    ) then
      raise exception 'Order not found';
    end if;
  end if;

  select stock_applied into applied
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found';
  end if;

  if applied then
    return;
  end if;

  for r in
    select oi.product_id, sum(oi.quantity)::int as qty
    from public.order_items oi
    where oi.order_id = p_order_id
      and oi.product_id is not null
    group by oi.product_id
  loop
    update public.products p
    set stock = p.stock - r.qty
    where p.id = r.product_id
      and p.stock >= r.qty;

    get diagnostics updated_rows = row_count;
    if updated_rows = 0 then
      raise exception 'Insufficient stock for product %', r.product_id
        using errcode = 'P0001';
    end if;
  end loop;

  update public.orders
  set stock_applied = true
  where id = p_order_id;
end;
$$;

grant execute on function public.decrement_stock_for_order(uuid) to authenticated;

-- Admin cancellation reason
alter table public.orders
  add column if not exists cancellation_reason text,
  add column if not exists cancelled_at timestamptz;
