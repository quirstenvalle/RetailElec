-- Quinto Store - customer rewards

create table if not exists public.reward_accounts (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  points integer not null default 0 check (points >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reward_offers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  offer_type text not null check (offer_type in ('voucher', 'coupon', 'raffle')),
  points_cost integer not null check (points_cost > 0),
  discount_amount numeric(12, 2),
  minimum_order numeric(12, 2),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.reward_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  points integer not null check (points <> 0),
  reason text not null,
  order_id uuid references public.orders(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  offer_id uuid not null references public.reward_offers(id),
  points_cost integer not null check (points_cost > 0),
  code text not null unique,
  status text not null default 'available' check (status in ('available', 'used', 'expired')),
  expires_at timestamptz not null default (now() + interval '90 days'),
  created_at timestamptz not null default now()
);

create table if not exists public.raffle_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  offer_id uuid not null references public.reward_offers(id),
  ledger_id uuid references public.reward_ledger(id) on delete set null,
  draw_month date not null,
  created_at timestamptz not null default now()
);

create index if not exists reward_ledger_user_idx on public.reward_ledger(user_id, created_at desc);
create index if not exists reward_redemptions_user_idx on public.reward_redemptions(user_id, created_at desc);
create index if not exists raffle_entries_user_idx on public.raffle_entries(user_id, draw_month);

alter table public.reward_accounts enable row level security;
alter table public.reward_offers enable row level security;
alter table public.reward_ledger enable row level security;
alter table public.reward_redemptions enable row level security;
alter table public.raffle_entries enable row level security;

drop policy if exists "reward_accounts_select_own" on public.reward_accounts;
create policy "reward_accounts_select_own" on public.reward_accounts for select to authenticated using (user_id = auth.uid());
drop policy if exists "reward_offers_select_active" on public.reward_offers;
create policy "reward_offers_select_active" on public.reward_offers for select to authenticated using (active = true or public.is_admin());
drop policy if exists "reward_ledger_select_own" on public.reward_ledger;
create policy "reward_ledger_select_own" on public.reward_ledger for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists "reward_redemptions_select_own" on public.reward_redemptions;
create policy "reward_redemptions_select_own" on public.reward_redemptions for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists "raffle_entries_select_own" on public.raffle_entries;
create policy "raffle_entries_select_own" on public.raffle_entries for select to authenticated using (user_id = auth.uid() or public.is_admin());

grant select on public.reward_accounts, public.reward_offers, public.reward_ledger, public.reward_redemptions, public.raffle_entries to authenticated;

do $$
begin
  insert into public.reward_offers (title, description, offer_type, points_cost, discount_amount, minimum_order)
  select * from (values
    ('P50 OFF', 'Valid on any wholesale order', 'voucher', 500, 50::numeric, 0::numeric),
    ('P100 OFF', 'Valid on any wholesale order over P5,000', 'voucher', 900, 100::numeric, 5000::numeric),
    ('10% OFF Wholesale Order', 'Discount applied to subtotal', 'coupon', 750, null::numeric, 0::numeric),
    ('Monthly Grocery Raffle', 'Win a grocery pack worth P10,000. Drawn at the end of each month.', 'raffle', 100, null::numeric, 0::numeric)
  ) as seed(title, description, offer_type, points_cost, discount_amount, minimum_order)
  where not exists (select 1 from public.reward_offers existing where existing.title = seed.title);
end $$;

create or replace function public.rewards_dashboard()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  account public.reward_accounts;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  insert into public.reward_accounts(user_id) values (auth.uid()) on conflict (user_id) do nothing;
  select * into account from public.reward_accounts where user_id = auth.uid();
  return jsonb_build_object(
    'account', jsonb_build_object('points', account.points, 'tier', case when account.points >= 1500 then 'Platinum' when account.points >= 750 then 'Gold Member' else 'Silver Member' end, 'nextTier', case when account.points >= 1500 then 'Platinum' when account.points >= 750 then 'Platinum' else 'Gold Member' end, 'pointsToNextTier', case when account.points >= 1500 then 0 when account.points >= 750 then 1500 - account.points else 750 - account.points end),
    'offers', coalesce((select jsonb_agg(to_jsonb(o) order by o.points_cost) from public.reward_offers o where o.active), '[]'::jsonb),
    'activity', coalesce((select jsonb_agg(to_jsonb(l) order by l.created_at desc) from public.reward_ledger l where l.user_id = auth.uid()), '[]'::jsonb),
    'redemptions', coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'title', o.title, 'code', r.code, 'status', r.status, 'expiresAt', r.expires_at) order by r.created_at desc) from public.reward_redemptions r join public.reward_offers o on o.id = r.offer_id where r.user_id = auth.uid()), '[]'::jsonb),
    'raffleEntries', (select count(*) from public.raffle_entries where user_id = auth.uid() and draw_month = date_trunc('month', current_date)::date)
  );
end;
$$;

create or replace function public.redeem_reward(p_offer_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  offer public.reward_offers;
  account public.reward_accounts;
  ledger public.reward_ledger;
  redemption public.reward_redemptions;
  raffle_entry_id uuid;
  code text;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select * into offer from public.reward_offers where id = p_offer_id and active for update;
  if offer.id is null then raise exception 'Reward is not available'; end if;
  insert into public.reward_accounts(user_id) values (auth.uid()) on conflict (user_id) do nothing;
  select * into account from public.reward_accounts where user_id = auth.uid() for update;
  if account.points < offer.points_cost then raise exception 'Not enough points'; end if;
  update public.reward_accounts set points = points - offer.points_cost, updated_at = now() where user_id = auth.uid();
  insert into public.reward_ledger(user_id, points, reason) values (auth.uid(), -offer.points_cost, 'Redeemed ' || offer.title) returning * into ledger;
  if offer.offer_type = 'raffle' then
    insert into public.raffle_entries(user_id, offer_id, ledger_id, draw_month) values (auth.uid(), offer.id, ledger.id, date_trunc('month', current_date)::date) returning id into raffle_entry_id;
    return jsonb_build_object('ok', true, 'type', 'raffle', 'entryId', raffle_entry_id);
  end if;
  code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
  insert into public.reward_redemptions(user_id, offer_id, points_cost, code) values (auth.uid(), offer.id, offer.points_cost, code) returning * into redemption;
  return jsonb_build_object('ok', true, 'type', offer.offer_type, 'redemption', jsonb_build_object('id', redemption.id, 'code', redemption.code, 'title', offer.title, 'expiresAt', redemption.expires_at));
end;
$$;

grant execute on function public.rewards_dashboard() to authenticated;
grant execute on function public.redeem_reward(uuid) to authenticated;

create or replace function public.award_order_rewards()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_id_value uuid;
  awarded integer;
begin
  if new.payment_status = 'paid' and (tg_op = 'INSERT' or old.payment_status is distinct from 'paid') then
    select c.user_id into user_id_value from public.customers c where c.id = new.customer_id;
    if user_id_value is null then select p.id into user_id_value from public.profiles p where lower(p.email) = lower(new.customer_email); end if;
    awarded := floor(new.total / 100);
    if user_id_value is not null and awarded > 0 and not exists (select 1 from public.reward_ledger where order_id = new.id) then
      insert into public.reward_accounts(user_id, points) values (user_id_value, awarded) on conflict (user_id) do update set points = public.reward_accounts.points + awarded, updated_at = now();
      insert into public.reward_ledger(user_id, points, reason, order_id) values (user_id_value, awarded, 'Order ' || new.order_number, new.id);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_award_rewards on public.orders;
create trigger orders_award_rewards after insert or update of payment_status on public.orders for each row execute procedure public.award_order_rewards();
