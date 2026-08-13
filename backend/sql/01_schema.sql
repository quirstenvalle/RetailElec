-- Quinto Store — schema
-- Project: jpunedofchmqquxrntls
-- Run in Supabase SQL Editor (in order: 01 → 02 → 03)

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
