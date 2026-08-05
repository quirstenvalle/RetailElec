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
