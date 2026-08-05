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
  v_customer_id text;
begin
  v_name := coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1), 'User');
  v_role := coalesce(new.raw_app_meta_data ->> 'role', 'customer');
  if v_role not in ('admin', 'customer') then
    v_role := 'customer';
  end if;
  v_phone := coalesce(new.raw_user_meta_data ->> 'phone', '');
  v_business := coalesce(new.raw_user_meta_data ->> 'business_name', '');

  insert into public.profiles (id, email, name, role, phone, business_name)
  values (new.id, lower(new.email), v_name, v_role, nullif(v_phone, ''), nullif(v_business, ''))
  on conflict (id) do update
    set email = excluded.email,
        name = excluded.name;

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
-- Arlen's Store â€” seed data + demo accounts
-- Project: jpunedofchmqquxrntls
-- Demo:
--   admin@arlen.store / admin123
--   customer@arlen.store / customer123

insert into public.categories (name, sort_order) values
  ('Laundry Care', 1),
  ('Canned Goods', 2),
  ('Dry Materials', 3),
  ('Beverages', 4),
  ('Snacks', 5)
on conflict (name) do nothing;

insert into public.products (
  id, name, category, display_category, unit_price, piece_price,
  pack_label, unit_weight, stock, image_path, is_featured
) values
  ('w-001', 'Surf Active Clean (Rose Fresh)', 'Laundry Care', 'LAUNDRY CARE', 1890, 24, '1 box (24x)', '45 lbs/unit', 120, '/assets/figma/product-surf.png', false),
  ('w-002', 'Tide Perfect Clean (Twin Pack Jumbo)', 'Laundry Care', 'LAUNDRY CARE', 1890, 24, '1 box (24x)', '200 lbs/unit', 84, '/assets/figma/product-tide.png', false),
  ('w-003', 'Downy Passion Fabric Conditioner', 'Laundry Care', 'LAUNDRY CARE', 1890, 24, '1 box (24x)', '25 lbs/unit', 96, '/assets/figma/product-downy.png', false),
  ('w-004', 'All Purpose Flour (25kg)', 'Dry Materials', 'DRY GOODS', 980, 980, '1 sack (25kg)', '25 kg/unit', 10, '/assets/figma/product-flour.png', true),
  ('w-005', 'White Sugar (25kg)', 'Dry Materials', 'DRY GOODS', 1100, 1100, '1 sack (25kg)', '25 kg/unit', 7, '/assets/figma/product-flour.png', false),
  ('w-006', 'Brown Sugar (25kg)', 'Dry Materials', 'DRY GOODS', 1050, 1050, '1 sack (25kg)', '25 kg/unit', 5, '/assets/figma/product-flour.png', false),
  ('w-007', 'Cornstarch', 'Dry Materials', 'DRY GOODS', 1000, 1000, '1 sack', '20 kg/unit', 10, '/assets/figma/product-flour.png', false),
  ('w-008', '555 Tuna Adobo (24pcs)', 'Canned Goods', 'CAN GOODS', 600, 25, '1 box (24x)', '12 lbs/unit', 7, '/assets/figma/product-tuna.png', true),
  ('w-009', 'San Marino Tuna Spicy (24pcs)', 'Canned Goods', 'CAN GOODS', 700, 29, '1 box (24x)', '12 lbs/unit', 9, '/assets/figma/product-tuna.png', false),
  ('w-010', 'Century Tuna (24pcs)', 'Canned Goods', 'CAN GOODS', 680, 28, '1 box (24x)', '12 lbs/unit', 5, '/assets/figma/product-tuna.png', false),
  ('w-011', 'Fresca Tuna Spicy (24pcs)', 'Canned Goods', 'CAN GOODS', 580, 24, '1 box (24x)', '12 lbs/unit', 7, '/assets/figma/product-tuna.png', false),
  ('w-012', 'TSL Detergent Powder (x24)', 'Laundry Care', 'LAUNDRY CARE', 900, 38, '1 box (24x)', '18 lbs/unit', 48, '/assets/figma/product-detergent.png', true)
on conflict (id) do nothing;

select setval('public.product_id_seq', 12, true);

insert into public.customers (id, name, email, phone, last_transaction) values
  ('c-001', 'Juan Dela Cruz', 'juan@store.com', '0912-345-6789', 'August 03, 2026'),
  ('c-002', 'Maria Santos', 'maria@retail.com', '0998-234-1142', 'August 02, 2026'),
  ('c-003', 'Pedro Reyes', 'pedro@mart.com', '0906-778-3210', 'August 01, 2026'),
  ('c-004', 'Ana Lopez', 'ana@grocer.com', '0917-555-2200', 'July 30, 2026'),
  ('c-005', 'Carlo Mendoza', 'carlo@mini.com', '0920-111-4455', 'July 28, 2026')
on conflict (email) do nothing;

select setval('public.customer_id_seq', 5, true);

insert into public.orders (order_number, receipt_id, customer_name, customer_email, status, order_date, total) values
  ('ORD 001', '#LMN-100001', 'Junita M. Dela Cruz', null, 'Pending', 'August 01, 2026', 0),
  ('ORD 002', '#LMN-100002', 'Pacito M. Santos', null, 'Pending', 'August 01, 2026', 0),
  ('ORD 003', '#LMN-100003', 'Angel Mae Estrera', null, 'Pending', 'August 03, 2026', 0),
  ('ORD 004', '#LMN-100004', 'Miguel Dela Verde', null, 'Processing', 'August 02, 2026', 0),
  ('ORD 005', '#LMN-100005', 'Sofia Rivera', null, 'Shipped', 'August 02, 2026', 0)
on conflict (order_number) do nothing;

select setval('public.order_number_seq', 5, true);

-- Demo auth users (bcrypt via pgcrypto)
do $$
declare
  admin_id uuid := '11111111-1111-1111-1111-111111111111';
  customer_id uuid := '22222222-2222-2222-2222-222222222222';
begin
  -- Admin
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

  -- Customer
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

  -- Ensure profile roles (trigger may have set customer by default before app_metadata on inserts)
  update public.profiles
  set role = 'admin', name = 'Store Admin'
  where email = 'admin@arlen.store';

  update public.profiles
  set role = 'customer', name = 'Juan Dela Cruz', phone = '0912-345-6789'
  where email = 'customer@arlen.store';
end $$;
