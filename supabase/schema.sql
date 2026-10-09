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

-- ---------------------------------------------------------------------------
-- Menu: one pack size (grams) and price per item, edited on the admin page.
-- Items with no price, or switched off, are hidden from the website.
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id          bigint generated always as identity primary key,
  name        text not null unique,          -- must match the website item name
  category    text not null,
  sort_order  int not null default 0,
  grams       int check (grams is null or grams between 1 and 100000),
  price       numeric(10, 2) check (price is null or price >= 0),
  active      boolean not null default true,
  updated_at  timestamptz not null default now()
);

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

alter table public.products enable row level security;

-- Current menu items (no prices yet). Re-running keeps existing prices.
insert into public.products (name, category, sort_order) values
  ('Millet Cookies (15+ Dryfruits)', 'Cookies', 10),
  ('Kesar Pista Cookies', 'Cookies', 20),
  ('Ragi Chocolate Cookies', 'Cookies', 30),
  ('Fruit Cookies', 'Cookies', 40),
  ('Almonds Oats Cookies', 'Cookies', 50),
  ('Ragi Cookies', 'Cookies', 60),
  ('Jowar Cookies', 'Cookies', 70),
  ('Multigrain Cookies', 'Cookies', 80),
  ('Vanilla Cookies', 'Cookies', 90),
  ('Butter Cookies', 'Cookies', 100),
  ('Chocolate Chip Cookies', 'Cookies', 110),
  ('Ragi Special – Almond', 'Ragi Special', 120),
  ('Ragi Special – Dry Fruit', 'Ragi Special', 130),
  ('Ragi Special – Cashew', 'Ragi Special', 140),
  ('Ragi Special – Millet', 'Ragi Special', 150),
  ('Ragi Special – Whole Wheat', 'Ragi Special', 160),
  ('Fudge Brownie', 'Brownies', 170),
  ('Chewy Brownie', 'Brownies', 180),
  ('Cakey Brownie', 'Brownies', 190),
  ('Dark Chocolate Brownie Bits', 'Brownies', 200),
  ('White Chocolate Brownie Bits', 'Brownies', 210),
  ('Triple Chocolate Brownie Bits', 'Brownies', 220),
  ('Dark & White Chocolate Brownie Bits', 'Brownies', 230),
  ('Vanilla Cupcakes', 'Cupcakes', 240),
  ('Chocolate Cupcakes', 'Cupcakes', 250),
  ('Strawberry Cupcakes', 'Cupcakes', 260),
  ('Butterscotch Cupcakes', 'Cupcakes', 270),
  ('Pineapple Cupcakes', 'Cupcakes', 280),
  ('Pista Cupcakes', 'Cupcakes', 290),
  ('Rasmalai Cupcakes', 'Cupcakes', 300)
on conflict (name) do nothing;
