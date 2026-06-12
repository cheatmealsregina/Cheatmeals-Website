-- CheatMeals — initial schema
-- Four tables: categories, items, site_content, leaderboard.

-- ============================================================
-- categories
-- ============================================================
create table public.categories (
  id          bigint generated always as identity primary key,
  name        text not null unique,
  slug        text not null unique check (slug ~ '^[a-z0-9-]+$'),
  sort_order  int  not null default 0,
  note        text,
  is_dietary  boolean not null default false
);

-- ============================================================
-- items
-- section: optional sub-section header within a category
--          (e.g. Aloo Burgers → "DOUBLE" / "SPICY ALOO" / "ALOO").
-- price:   null renders as "N/A" (the Extra Fries joke).
-- badges:  jsonb array matching the app shape, e.g.
--          [{"kind":"pick","label":"Chef's Pick"},
--           {"kind":"spicy","level":1,"label":"Spicy"}]
-- ============================================================
create table public.items (
  id           bigint generated always as identity primary key,
  category_id  bigint not null references public.categories (id) on delete cascade,
  section      text,
  name         text not null,
  description  text,
  price        numeric(8, 2) check (price is null or price >= 0),
  badges       jsonb not null default '[]'::jsonb check (jsonb_typeof(badges) = 'array'),
  photo_url    text,
  is_available boolean not null default true,
  sort_order   int not null default 0,
  unique (category_id, name)
);

create index items_category_idx on public.items (category_id, sort_order);

-- ============================================================
-- site_content — key/value store for editable copy
-- (about story, hours, contact details, team, announcement…)
-- ============================================================
create table public.site_content (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

create or replace function public.touch_site_content()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger site_content_touch
  before update on public.site_content
  for each row execute function public.touch_site_content();

-- ============================================================
-- leaderboard — Patty Stacker scores
-- ============================================================
create table public.leaderboard (
  id         bigint generated always as identity primary key,
  initials   char(3) not null check (initials ~ '^[A-Z]{1,3} {0,2}$'),
  score      int not null check (score >= 0),
  created_at timestamptz not null default now()
);

create index leaderboard_score_idx on public.leaderboard (score desc, created_at);

-- ============================================================
-- Row Level Security
-- Public site reads everything; only authenticated staff write.
-- Anyone may submit a leaderboard score (the game has no login).
-- ============================================================
alter table public.categories   enable row level security;
alter table public.items        enable row level security;
alter table public.site_content enable row level security;
alter table public.leaderboard  enable row level security;

create policy "public read"  on public.categories   for select using (true);
create policy "staff write"  on public.categories   for all    to authenticated using (true) with check (true);

create policy "public read"  on public.items        for select using (true);
create policy "staff write"  on public.items        for all    to authenticated using (true) with check (true);

create policy "public read"  on public.site_content for select using (true);
create policy "staff write"  on public.site_content for all    to authenticated using (true) with check (true);

create policy "public read"   on public.leaderboard for select using (true);
create policy "public submit" on public.leaderboard for insert with check (true);
create policy "staff manage"  on public.leaderboard for delete to authenticated using (true);
