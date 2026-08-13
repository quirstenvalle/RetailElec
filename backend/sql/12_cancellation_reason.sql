-- Admin cancellation reason for customer orders
alter table public.orders
  add column if not exists cancellation_reason text,
  add column if not exists cancelled_at timestamptz;
