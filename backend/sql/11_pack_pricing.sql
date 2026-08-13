-- Allow pack pricing unit; add pack_price on products
alter table public.products
  add column if not exists pack_price numeric(12, 2) not null default 0 check (pack_price >= 0);

alter table public.order_items
  add column if not exists pack_price numeric(12, 2);

alter table public.cart_items drop constraint if exists cart_items_pricing_unit_check;
alter table public.order_items drop constraint if exists order_items_pricing_unit_check;

do $$
declare
  r record;
begin
  for r in
    select con.conname, con.conrelid::regclass as tbl
    from pg_constraint con
    join pg_attribute att on att.attrelid = con.conrelid and att.attnum = any (con.conkey)
    where con.contype = 'c'
      and att.attname = 'pricing_unit'
      and con.conrelid in ('public.cart_items'::regclass, 'public.order_items'::regclass)
  loop
    execute format('alter table %s drop constraint if exists %I', r.tbl, r.conname);
  end loop;
end $$;

alter table public.cart_items
  add constraint cart_items_pricing_unit_check
  check (pricing_unit in ('box', 'piece', 'pack'));

alter table public.order_items
  add constraint order_items_pricing_unit_check
  check (pricing_unit in ('box', 'piece', 'pack'));
