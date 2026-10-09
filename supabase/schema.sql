-- Moon's Kitchen database (Supabase / Postgres).
-- Run once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
-- Safe to re-run.
--
-- Security: Row Level Security is ON with NO policies, so the public
-- (anon / publishable) key can't read or write anything. Only the Netlify
-- functions, using the secret key stored in Netlify env vars, can.

create table if not exists public.orders (
  id              bigint generated always as identity (start with 1001) primary key,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  customer_email  text not null,
  customer_name   text not null,
  phone           text not null,
  items           jsonb not null,                -- [{ "item": "Ragi Cookies", "qty": 2 }]
  fulfilment      text not null check (fulfilment in ('pickup', 'delivery')),
  address         text,
  preferred_date  date,
  notes           text,
  status          text not null default 'new'
                  check (status in ('new', 'confirmed', 'ready', 'completed', 'cancelled')),
  total_price     numeric(10, 2),               -- set by the owner when confirming
  admin_note      text                          -- shown to the customer
);

create index if not exists orders_customer_idx on public.orders (customer_email, created_at desc);
create index if not exists orders_status_idx on public.orders (status, created_at desc);

create table if not exists public.reviews (
  id              bigint generated always as identity primary key,
  created_at      timestamptz not null default now(),
  order_id        bigint not null unique references public.orders (id) on delete cascade,
  customer_email  text not null,
  display_name    text not null,
  rating          smallint not null check (rating between 1 and 5),
  comment         text not null,
  item_summary    text,
  status          text not null default 'pending'
                  check (status in ('pending', 'approved', 'hidden'))
);

create index if not exists reviews_status_idx on public.reviews (status, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

alter table public.orders enable row level security;
alter table public.reviews enable row level security;
