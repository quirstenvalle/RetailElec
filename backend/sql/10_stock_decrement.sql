-- Decrement product stock when an order succeeds (COD or paid online).
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
