-- CheatMeals — jokes table
-- "While you wait" one-liners shown around the game / menu.
-- lang carries the full planned language set even though only en/hi
-- are populated today, so future translations need no schema change.
-- category is free-form (e.g. 'burger','desi','dad') for later theming.
create table public.jokes (
  id          bigint generated always as identity primary key,
  lang        text not null check (lang in ('en','hi','gu','pa','ml','kn','te')),
  text        text not null,
  category    text,
  is_active   boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  -- body must carry real content and stay short enough for a one-liner
  constraint jokes_text_not_blank check (btrim(text) <> ''),
  constraint jokes_text_max_len   check (length(text) <= 500)
);

create index jokes_lang_active_idx on public.jokes (lang, is_active);

-- ============================================================
-- Row Level Security
-- Public site reads only active jokes; authenticated staff manage all.
-- ============================================================
alter table public.jokes enable row level security;

create policy "public read" on public.jokes for select using (is_active = true);
create policy "staff write" on public.jokes for all    to authenticated using (true) with check (true);
