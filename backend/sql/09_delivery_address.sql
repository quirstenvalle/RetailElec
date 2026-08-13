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
