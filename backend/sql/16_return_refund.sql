-- Return and refund workflow for customer orders
alter table public.orders
  add column if not exists return_status text default 'not_requested'
    check (return_status in ('not_requested', 'requested', 'approved', 'rejected', 'completed')),
  add column if not exists return_reason text,
  add column if not exists return_requested_at timestamptz,
  add column if not exists refund_amount numeric(12, 2) default 0 check (refund_amount >= 0),
  add column if not exists refund_note text,
  add column if not exists refunded_at timestamptz;

create index if not exists orders_return_status_idx on public.orders (return_status);

comment on column public.orders.return_status is 'Current return lifecycle for the order';
comment on column public.orders.return_reason is 'Customer reason when requesting a return';
comment on column public.orders.return_requested_at is 'When the return request was submitted';
comment on column public.orders.refund_amount is 'Approved refund amount for the order';
comment on column public.orders.refund_note is 'Store approval or rejection note';
comment on column public.orders.refunded_at is 'When the refund was officially approved and posted';
