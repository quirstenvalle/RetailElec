-- Cart / order pricing unit (box vs piece)
alter table public.cart_items
  add column if not exists pricing_unit text not null default 'box'
    check (pricing_unit in ('box', 'piece'));

alter table public.order_items
  add column if not exists pricing_unit text not null default 'box'
    check (pricing_unit in ('box', 'piece'));

alter table public.cart_items drop constraint if exists cart_items_user_id_product_id_key;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'cart_items_user_product_unit_key'
  ) then
    alter table public.cart_items
      add constraint cart_items_user_product_unit_key unique (user_id, product_id, pricing_unit);
  end if;
end $$;
