-- Order shipment fields
alter table public.orders
  add column if not exists shipping_carrier text,
  add column if not exists tracking_number text,
  add column if not exists shipped_at date,
  add column if not exists shipping_fee numeric(12, 2) not null default 0 check (shipping_fee >= 0);
