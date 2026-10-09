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
-- Menu: one pack per item (a weight in grams, or a number of pieces) and a
-- price, edited on the admin page. Items with no price, or switched off,
-- are hidden from the website.
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id          bigint generated always as identity primary key,
  name        text not null unique,          -- must match the website item name
  category    text not null,
  sort_order  int not null default 0,
  pack_size   int check (pack_size is null or pack_size between 1 and 100000),
  unit        text not null default 'g' check (unit in ('g', 'pcs')),
  price       numeric(10, 2) check (price is null or price >= 0),
  active      boolean not null default true,
  updated_at  timestamptz not null default now()
);

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

alter table public.products enable row level security;

-- Starting menu. Cookies are per ½ kg. Lines marked "estimate" are rough
-- prices to check on the admin page. Re-running keeps prices you've changed.
insert into public.products (name, category, sort_order, pack_size, unit, price) values
  ('Millet Cookies (15+ Dryfruits)', 'Cookies', 10, 500, 'g', 1200),
  ('Kesar Pista Cookies', 'Cookies', 20, 500, 'g', 900),
  ('Ragi Chocolate Cookies', 'Cookies', 30, 500, 'g', 700),
  ('Fruit Cookies', 'Cookies', 40, 500, 'g', 750),
  ('Almonds Oats Cookies', 'Cookies', 50, 500, 'g', 750),
  ('Ragi Cookies', 'Cookies', 60, 500, 'g', 600),
  ('Jowar Cookies', 'Cookies', 70, 500, 'g', 600),
  ('Multigrain Cookies', 'Cookies', 80, 500, 'g', 800),
  ('Vanilla Cookies', 'Cookies', 90, 500, 'g', 600),  -- estimate, please check
  ('Butter Cookies', 'Cookies', 100, 500, 'g', 600),  -- estimate, please check
  ('Chocolate Chip Cookies', 'Cookies', 110, 500, 'g', 700),  -- estimate, please check
  ('Ragi Special – Almond', 'Ragi Special', 120, 500, 'g', 800),  -- estimate, please check
  ('Ragi Special – Dry Fruit', 'Ragi Special', 130, 500, 'g', 900),  -- estimate, please check
  ('Ragi Special – Cashew', 'Ragi Special', 140, 500, 'g', 850),  -- estimate, please check
  ('Ragi Special – Millet', 'Ragi Special', 150, 500, 'g', 750),  -- estimate, please check
  ('Ragi Special – Whole Wheat', 'Ragi Special', 160, 500, 'g', 650),  -- estimate, please check
  ('Nutella Brownies – Box of 9', 'Brownies', 170, 9, 'pcs', 950),
  ('Nutella Brownies – 5 pcs', 'Brownies', 180, 5, 'pcs', 500),
  ('Dark Brownies – Box of 9', 'Brownies', 190, 9, 'pcs', 800),
  ('Dark Brownies – 4 pcs', 'Brownies', 200, 4, 'pcs', 360),
  ('Fudge Brownie', 'Brownies', 210, 9, 'pcs', 800),  -- estimate, please check
  ('Chewy Brownie', 'Brownies', 220, 9, 'pcs', 800),  -- estimate, please check
  ('Cakey Brownie', 'Brownies', 230, 9, 'pcs', 750),  -- estimate, please check
  ('Dark Chocolate Brownie Bits', 'Brownies', 240, 250, 'g', 400),  -- estimate, please check
  ('White Chocolate Brownie Bits', 'Brownies', 250, 250, 'g', 400),  -- estimate, please check
  ('Triple Chocolate Brownie Bits', 'Brownies', 260, 250, 'g', 450),  -- estimate, please check
  ('Dark & White Chocolate Brownie Bits', 'Brownies', 270, 250, 'g', 420),  -- estimate, please check
  ('Vanilla Cupcakes', 'Cupcakes', 280, 1, 'pcs', 15),
  ('Chocolate Cupcakes', 'Cupcakes', 290, 1, 'pcs', 15),
  ('Strawberry Cupcakes', 'Cupcakes', 300, 1, 'pcs', 15),
  ('Butterscotch Cupcakes', 'Cupcakes', 310, 1, 'pcs', 15),
  ('Pineapple Cupcakes', 'Cupcakes', 320, 1, 'pcs', 15),
  ('Pista Cupcakes', 'Cupcakes', 330, 1, 'pcs', 15),
  ('Rasmalai Cupcakes', 'Cupcakes', 340, 1, 'pcs', 15)
on conflict (name) do nothing;
