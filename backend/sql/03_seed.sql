-- Arlen's Store — seed data + demo accounts
-- Project: jpunedofchmqquxrntls
-- Demo:
--   admin@arlen.store / admin123
--   customer@arlen.store / customer123

insert into public.categories (name, sort_order) values
  ('Laundry Care', 1),
  ('Canned Goods', 2),
  ('Dry Materials', 3),
  ('Beverages', 4),
  ('Snacks', 5)
on conflict (name) do nothing;

insert into public.products (
  id, name, category, display_category, unit_price, piece_price,
  pack_label, unit_weight, stock, image_path, is_featured
) values
  ('w-001', 'Surf Active Clean (Rose Fresh)', 'Laundry Care', 'LAUNDRY CARE', 1890, 24, '1 box (24x)', '45 lbs/unit', 120, '/assets/figma/product-surf.png', false),
  ('w-002', 'Tide Perfect Clean (Twin Pack Jumbo)', 'Laundry Care', 'LAUNDRY CARE', 1890, 24, '1 box (24x)', '200 lbs/unit', 84, '/assets/figma/product-tide.png', false),
  ('w-003', 'Downy Passion Fabric Conditioner', 'Laundry Care', 'LAUNDRY CARE', 1890, 24, '1 box (24x)', '25 lbs/unit', 96, '/assets/figma/product-downy.png', false),
  ('w-004', 'All Purpose Flour (25kg)', 'Dry Materials', 'DRY GOODS', 980, 980, '1 sack (25kg)', '25 kg/unit', 10, '/assets/figma/product-flour.png', true),
  ('w-005', 'White Sugar (25kg)', 'Dry Materials', 'DRY GOODS', 1100, 1100, '1 sack (25kg)', '25 kg/unit', 7, '/assets/figma/product-flour.png', false),
  ('w-006', 'Brown Sugar (25kg)', 'Dry Materials', 'DRY GOODS', 1050, 1050, '1 sack (25kg)', '25 kg/unit', 5, '/assets/figma/product-flour.png', false),
  ('w-007', 'Cornstarch', 'Dry Materials', 'DRY GOODS', 1000, 1000, '1 sack', '20 kg/unit', 10, '/assets/figma/product-flour.png', false),
  ('w-008', '555 Tuna Adobo (24pcs)', 'Canned Goods', 'CAN GOODS', 600, 25, '1 box (24x)', '12 lbs/unit', 7, '/assets/figma/product-tuna.png', true),
  ('w-009', 'San Marino Tuna Spicy (24pcs)', 'Canned Goods', 'CAN GOODS', 700, 29, '1 box (24x)', '12 lbs/unit', 9, '/assets/figma/product-tuna.png', false),
  ('w-010', 'Century Tuna (24pcs)', 'Canned Goods', 'CAN GOODS', 680, 28, '1 box (24x)', '12 lbs/unit', 5, '/assets/figma/product-tuna.png', false),
  ('w-011', 'Fresca Tuna Spicy (24pcs)', 'Canned Goods', 'CAN GOODS', 580, 24, '1 box (24x)', '12 lbs/unit', 7, '/assets/figma/product-tuna.png', false),
  ('w-012', 'TSL Detergent Powder (x24)', 'Laundry Care', 'LAUNDRY CARE', 900, 38, '1 box (24x)', '18 lbs/unit', 48, '/assets/figma/product-detergent.png', true)
on conflict (id) do nothing;

select setval('public.product_id_seq', 12, true);

insert into public.customers (id, name, email, phone, last_transaction) values
  ('c-001', 'Juan Dela Cruz', 'juan@store.com', '0912-345-6789', 'August 03, 2026'),
  ('c-002', 'Maria Santos', 'maria@retail.com', '0998-234-1142', 'August 02, 2026'),
  ('c-003', 'Pedro Reyes', 'pedro@mart.com', '0906-778-3210', 'August 01, 2026'),
  ('c-004', 'Ana Lopez', 'ana@grocer.com', '0917-555-2200', 'July 30, 2026'),
  ('c-005', 'Carlo Mendoza', 'carlo@mini.com', '0920-111-4455', 'July 28, 2026')
on conflict (email) do nothing;

select setval('public.customer_id_seq', 5, true);

insert into public.orders (order_number, receipt_id, customer_name, customer_email, status, order_date, total) values
  ('ORD 001', '#LMN-100001', 'Junita M. Dela Cruz', null, 'Pending', 'August 01, 2026', 0),
  ('ORD 002', '#LMN-100002', 'Pacito M. Santos', null, 'Pending', 'August 01, 2026', 0),
  ('ORD 003', '#LMN-100003', 'Angel Mae Estrera', null, 'Pending', 'August 03, 2026', 0),
  ('ORD 004', '#LMN-100004', 'Miguel Dela Verde', null, 'Processing', 'August 02, 2026', 0),
  ('ORD 005', '#LMN-100005', 'Sofia Rivera', null, 'Shipped', 'August 02, 2026', 0)
on conflict (order_number) do nothing;

select setval('public.order_number_seq', 5, true);

-- Demo auth users (bcrypt via pgcrypto)
do $$
declare
  admin_id uuid := '11111111-1111-1111-1111-111111111111';
  customer_id uuid := '22222222-2222-2222-2222-222222222222';
begin
  -- Admin
  if not exists (select 1 from auth.users where email = 'admin@arlen.store') then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000',
      admin_id,
      'authenticated',
      'authenticated',
      'admin@arlen.store',
      crypt('admin123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"],"role":"admin"}'::jsonb,
      '{"name":"Store Admin"}'::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    insert into auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) values (
      admin_id,
      admin_id,
      format('{"sub":"%s","email":"admin@arlen.store"}', admin_id)::jsonb,
      'email',
      admin_id::text,
      now(),
      now(),
      now()
    );
  end if;

  -- Customer
  if not exists (select 1 from auth.users where email = 'customer@arlen.store') then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000',
      customer_id,
      'authenticated',
      'authenticated',
      'customer@arlen.store',
      crypt('customer123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"],"role":"customer"}'::jsonb,
      '{"name":"Juan Dela Cruz","phone":"0912-345-6789"}'::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    insert into auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) values (
      customer_id,
      customer_id,
      format('{"sub":"%s","email":"customer@arlen.store"}', customer_id)::jsonb,
      'email',
      customer_id::text,
      now(),
      now(),
      now()
    );
  end if;

  -- Ensure profile roles (trigger may have set customer by default before app_metadata on inserts)
  update public.profiles
  set role = 'admin', name = 'Store Admin'
  where email = 'admin@arlen.store';

  update public.profiles
  set role = 'customer', name = 'Juan Dela Cruz', phone = '0912-345-6789'
  where email = 'customer@arlen.store';
end $$;
