-- Arlen's Store — Row Level Security
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
