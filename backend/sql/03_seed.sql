-- Categories + login accounts only (no sample catalog/orders/customers)
-- Demo logins kept intentionally:
--   admin@arlen.store / admin123
--   customer@arlen.store / customer123

insert into public.categories (name, sort_order) values
  ('Laundry Care', 1),
  ('Canned Goods', 2),
  ('Dry Materials', 3),
  ('Beverages', 4),
  ('Snacks', 5)
on conflict (name) do nothing;

do $$
declare
  admin_id uuid := '11111111-1111-1111-1111-111111111111';
  customer_id uuid := '22222222-2222-2222-2222-222222222222';
begin
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

  update public.profiles
  set role = 'admin', name = 'Store Admin'
  where email = 'admin@arlen.store';

  update public.profiles
  set role = 'customer', name = 'Juan Dela Cruz', phone = '0912-345-6789'
  where email = 'customer@arlen.store';
end $$;
