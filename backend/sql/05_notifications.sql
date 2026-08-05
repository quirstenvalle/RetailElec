-- Notifications helpers (applied remotely)
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null default '',
  type text not null default 'info'
    check (type in ('info', 'order', 'payment', 'system')),
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
