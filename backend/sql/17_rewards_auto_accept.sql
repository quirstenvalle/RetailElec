-- Automatically accept point redemptions.

update public.reward_redemptions
set fulfillment_status = 'completed'
where fulfillment_status = 'pending';

alter table public.reward_redemptions
  alter column fulfillment_status set default 'completed';
