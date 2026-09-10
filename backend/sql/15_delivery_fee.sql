-- Apply a small courier delivery fee on new customer orders.
-- Pickup stays free. Admin shipment updates can still change shipping_fee later.

create or replace function public.apply_customer_delivery_fee()
returns trigger
language plpgsql
as $$
begin
  if new.delivery_mode = 'courier' and coalesce(new.shipping_fee, 0) = 0 then
    new.shipping_fee := 30;
  elsif new.delivery_mode = 'pickup' then
    new.shipping_fee := 0;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_apply_customer_delivery_fee on public.orders;
create trigger orders_apply_customer_delivery_fee
before insert on public.orders
for each row
execute procedure public.apply_customer_delivery_fee();
