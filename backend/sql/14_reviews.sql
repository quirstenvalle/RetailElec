-- Customer feedback for the store and each completed transaction.
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  review_type text not null check (review_type in ('store', 'order')),
  rating int not null check (rating between 1 and 5),
  comment text,
  customer_name text not null,
  customer_email text not null,
  status text not null default 'published' check (status in ('published', 'hidden')),
  created_at timestamptz not null default now(),
  unique (order_id, review_type)
);

create index if not exists reviews_created_at_idx on public.reviews (created_at desc);
create index if not exists reviews_type_idx on public.reviews (review_type);

alter table public.reviews enable row level security;

drop policy if exists "reviews_admin_all" on public.reviews;
create policy "reviews_admin_all"
  on public.reviews for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "reviews_customer_select_own" on public.reviews;
create policy "reviews_customer_select_own"
  on public.reviews for select
  to authenticated
  using (customer_email = (select email from public.profiles where id = auth.uid()));

drop policy if exists "reviews_customer_insert_own_order" on public.reviews;
create policy "reviews_customer_insert_own_order"
  on public.reviews for insert
  to authenticated
  with check (
    customer_email = (select email from public.profiles where id = auth.uid())
    and exists (
      select 1 from public.orders o
      where o.id = order_id
        and o.customer_email = (select email from public.profiles where id = auth.uid())
        and o.status <> 'Cancelled'
    )
  );

drop policy if exists "reviews_customer_update_own" on public.reviews;
create policy "reviews_customer_update_own"
  on public.reviews for update
  to authenticated
  using (customer_email = (select email from public.profiles where id = auth.uid()))
  with check (customer_email = (select email from public.profiles where id = auth.uid()));

grant select, insert, update on public.reviews to authenticated;