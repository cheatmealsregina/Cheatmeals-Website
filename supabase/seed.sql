-- CheatMeals — seed data (full menu)
-- Generated from _reference/_menu-data.mjs (transcribed from the 7th June 2026
-- menu PDF). Idempotent: ON CONFLICT upserts + placeholder deletes, so this is
-- safe to run against the live DB or a fresh `supabase db reset`.
-- Run _reference/_gen-seed.mjs to regenerate after editing the menu data.

-- ============================================================
-- categories
-- ============================================================
insert into public.categories (name, slug, sort_order, note, is_dietary) values
  ('Aloo Burgers', 'aloo-burgers', 1, 'We make our own patties. All burgers are served with a side of fries, chips, Doritos, or Cheetos.', false),
  ('Paneer Burgers', 'paneer-burgers', 2, 'We make our own patties. All burgers are served with a side of fries, chips, Doritos, or Cheetos.', false),
  ('Frankies', 'frankies', 3, 'Honest advice: one''s enough for most people', false),
  ('Sand-Witches', 'sand-witches', 4, 'It''s not actual witchcraft, but it will possess you', false),
  ('Pavs', 'pavs', 5, null, false),
  ('Loaded Fries', 'loaded-fries', 6, 'Matches your taste better than your ex', false),
  ('Seasoned Fries', 'seasoned-fries', 7, null, false),
  ('Add-Ons & Dips', 'add-ons-dips', 8, null, false),
  ('Eggless', 'eggless', 9, 'For softhearted foodies', true),
  ('Jain', 'jain', 10, 'No root vegetables, no onion, no garlic', true),
  ('Swaminarayan', 'swaminarayan', 11, 'No onion, no garlic — Swaminarayan friendly', true)
on conflict (slug) do update set
  name = excluded.name, sort_order = excluded.sort_order,
  note = excluded.note, is_dietary = excluded.is_dietary;

-- ============================================================
-- items — aloo-burgers
-- ============================================================
insert into public.items (category_id, section, name, description, price, badges, sort_order)
select c.id, v.section, v.name, v.description, v.price, v.badges::jsonb, v.sort_order
from public.categories c
join (values
  ('Double Patty', 'The Red Hulk', 'Double aloo patty, double cheese, schezwan chutney and mayo, cilantro, onions and jalapenos', 14.99, '[{"kind":"pick","label":"Chef''s Pick"},{"kind":"spicy","level":1,"label":"Spicy"}]', 1),
  ('Spicy Aloo', 'Aloo Anarkali', 'Spicy potato patty, cilantro, crispy onions, sriracha drizzle, roasted garlic, mayo, jalapenos, pickled onions and marble cheese', 12.99, '[{"kind":"pick","label":"Chef''s Pick"},{"kind":"spicy","level":1,"label":"Spicy"}]', 2),
  ('Spicy Aloo', 'Aloo 420', 'Saucy affair of schezwan and garlic mayo, cilantro, minty and spicy aloo patty, onions, jalapenos, marble cheese', 11.99, '[]', 3),
  ('Spicy Aloo', 'Amdavadi Chaska 2.0', 'Spicy aloo patty, caramalised onion masala, hint of pickled onions, signature burger sauce, marble cheese', 11.99, '[]', 4),
  ('Spicy Aloo', 'Masala Aloo Tikki', 'Spicy aloo patty, signature burger sauce, pickled onions, cilantro, marble cheese', 10.99, '[{"kind":"spicy","level":1,"label":"Spicy"}]', 5),
  ('Spicy Aloo', 'Achari Aloo', 'Spicy aloo patty, cilantro, pickled onions, crispy chips, mint mayo, marble cheese', 9.99, '[]', 6),
  ('Aloo', 'Red Devil', 'Aloo patty, schezwan chutney with sriracha, schezwan mayo, jalapenos, onions, cilantro, crispy onions, marble cheese', 12.99, '[{"kind":"spicy","level":2,"label":"Extra Spicy"}]', 7),
  ('Aloo', 'Veggie Delight', 'Aloo patty, cilantro, jalapenos, pickled onions, olives, available veggies, signature burger sauce and marble cheese', 11.99, '[]', 8),
  ('Aloo', 'Schezwan Aloo Tikki', 'Aloo patty, pickled onions, jalapenos, marble cheese, schezwan mayo', 10.99, '[{"kind":"pick","label":"Chef''s Pick"},{"kind":"spicy","level":1,"label":"Spicy"}]', 9),
  ('Aloo', 'Aloo Makhni', 'Aloo patty, onions, cilantro, cream, makhni gravy, crispy onions, green peppers, marble cheese', 10.99, '[]', 10),
  ('Aloo', 'Amdavadi Chaska', 'Aloo patty, caramalised onion masala, hint of pickled onions, mint mayo, marble cheese', 10.99, '[{"kind":"pick","label":"Chef''s Pick"}]', 11),
  ('Aloo', 'Peri-Peri', 'Aloo patty, cilantro, jalapenos, pickled onions, olives, peri peri masala, peri peri mayo, marble cheese', 10.99, '[]', 12),
  ('Aloo', 'Aloo Tikki', 'Aloo patty, signature burger sauce, pickled onions, cilantro, marble cheese', 9.99, '[]', 13)
) as v(section, name, description, price, badges, sort_order) on true
where c.slug = 'aloo-burgers'
on conflict (category_id, name) do update set
  section = excluded.section, description = excluded.description,
  price = excluded.price, badges = excluded.badges,
  sort_order = excluded.sort_order, is_available = true;

-- ============================================================
-- items — paneer-burgers
-- ============================================================
insert into public.items (category_id, section, name, description, price, badges, sort_order)
select c.id, v.section, v.name, v.description, v.price, v.badges::jsonb, v.sort_order
from public.categories c
join (values
  ('Double Patty', 'King Kong Paneer', 'Double paneer patties tossed in chilli sauce, crispy onions and cilantro, marble cheese, schezwan mayo, jalapenos, pickled onions', 14.99, '[{"kind":"pick","label":"Chef''s Pick"}]', 1),
  ('Paneer', 'Hong Kong Paneer', 'Paneer patty tossed in chilli sauce, crispy onions and cilantro, marble cheese, schezwan mayo, jalapenos, pickled onions', 12.99, '[]', 2),
  ('Paneer', 'Flame Thrower Paneer', 'Crispy paneer patty, schezwan chutney with sriracha, schezwan mayo, jalapenos, onions, cilantro, crispy onions, marble cheese', 12.99, '[{"kind":"pick","label":"Chef''s Pick"},{"kind":"spicy","level":1,"label":"Spicy"}]', 3),
  ('Paneer', 'Paneer Pataka', 'Crispy paneer patty, cilantro, crispy onions, sriracha drizzle, roasted garlic mayo, jalapenos, pickled onions, marble cheese', 12.99, '[{"kind":"pick","label":"Chef''s Pick"}]', 4),
  ('Paneer', 'Paneer Chaska', 'Crispy paneer patty, caramalised onion masala, hint of pickled onions, mint mayo, marble cheese', 12.99, '[]', 5),
  ('Paneer', 'Veggie Paneer Delight', 'Crispy paneer patty, cilantro, jalapenos, pickled onions, olives, available veggies, signature burger sauce, marble cheese', 12.99, '[]', 6),
  ('Paneer', 'Paneer Makhni', 'Crispy paneer patty, onions, cilantro, cream, makhni gravy, crispy onions, green peppers, marble cheese', 11.99, '[]', 7),
  ('Paneer', 'Crispy Schezwan', 'Crispy paneer patty, pickled onions, jalapenos, marble cheese, schezwan mayo', 11.99, '[{"kind":"spicy","level":1,"label":"Spicy"}]', 8)
) as v(section, name, description, price, badges, sort_order) on true
where c.slug = 'paneer-burgers'
on conflict (category_id, name) do update set
  section = excluded.section, description = excluded.description,
  price = excluded.price, badges = excluded.badges,
  sort_order = excluded.sort_order, is_available = true;

-- ============================================================
-- items — frankies
-- ============================================================
insert into public.items (category_id, section, name, description, price, badges, sort_order)
select c.id, v.section, v.name, v.description, v.price, v.badges::jsonb, v.sort_order
from public.categories c
join (values
  (null, 'Chilli Paneer Frankie', 'Classic indo-chinese paneer chilli in a wrap', 12.99, '[{"kind":"pick","label":"Chef''s Pick"}]', 1),
  (null, 'Schezwan Paneer', 'Pahadi paneer masala, house veggie mix, schezwan sauce, cheese X lays', 12.99, '[]', 2),
  (null, 'Paneer Lifafa', 'Paneer patty, house veggie mix, garlic sauce, sriracha drizzle, cheese X lays, crispy onions, hint of jalapenos', 12.99, '[{"kind":"pick","label":"Chef''s Pick"},{"kind":"spicy","level":1,"label":"Spicy"}]', 3),
  (null, 'OG Paneer Frankie', 'Paneer patty, house veggie mix, schezwan chutney, schezwan mayo, cheese X lays', 12.99, '[{"kind":"spicy","level":1,"label":"Spicy"}]', 4),
  (null, 'OG Aloo Frankie', 'Aloo patty, house veggie mix, ketchup X chutney, mint mayo, cheese X lays', 11.99, '[{"kind":"pick","label":"Chef''s Pick"}]', 5),
  (null, 'Schezwan Aloo Frankie', 'Aloo patty, house veggie mix, schezwan chutney, schezwan mayo, cheese X lays', 11.99, '[]', 6),
  (null, 'Achari Aloo Frankie', 'Spicy aloo patty, house veggie mix, ketchup X chutney, mint mayo, cheese X lays, squeeze of lemon', 11.99, '[]', 7)
) as v(section, name, description, price, badges, sort_order) on true
where c.slug = 'frankies'
on conflict (category_id, name) do update set
  section = excluded.section, description = excluded.description,
  price = excluded.price, badges = excluded.badges,
  sort_order = excluded.sort_order, is_available = true;

-- ============================================================
-- items — sand-witches
-- ============================================================
insert into public.items (category_id, section, name, description, price, badges, sort_order)
select c.id, v.section, v.name, v.description, v.price, v.badges::jsonb, v.sort_order
from public.categories c
join (values
  (null, 'Junglee Paneer', 'Paneer smothered with tandoori and schezwan sauce along with pickled onion and green pepper and marble cheese', 12.99, '[]', 1),
  (null, 'Cheese Chilli Garlic', 'Our twist to ghughra sandwich', 12.99, '[{"kind":"pick","label":"Chef''s Pick"},{"kind":"spicy","level":1,"label":"Spicy"}]', 2),
  (null, 'Cheese Chilli Onion', 'Tribute to the famous Hughes sandwich', 11.99, '[]', 3),
  (null, 'Classic Grill Cheese', 'With a twist: garlic butter, marble cheese and chat masala', 9.99, '[]', 4),
  (null, 'Cheese-Chutney', 'Our in-house spicy chutney with marble cheese!', 9.99, '[{"kind":"pick","label":"Chef''s Pick"}]', 5)
) as v(section, name, description, price, badges, sort_order) on true
where c.slug = 'sand-witches'
on conflict (category_id, name) do update set
  section = excluded.section, description = excluded.description,
  price = excluded.price, badges = excluded.badges,
  sort_order = excluded.sort_order, is_available = true;

-- ============================================================
-- items — pavs
-- ============================================================
insert into public.items (category_id, section, name, description, price, badges, sort_order)
select c.id, v.section, v.name, v.description, v.price, v.badges::jsonb, v.sort_order
from public.categories c
join (values
  (null, 'Pahadi Paneer', 'Marinated paneer in our secret sauce with marble cheese, schezwan and tandoori sauce', 12.99, '[{"kind":"pick","label":"Chef''s Pick"}]', 1),
  (null, 'CMS2', 'Pav stuffed with our secret onion masala, with marble cheese and sweet-chilly mayo', 10.99, '[]', 2),
  (null, 'Peri-Peri', 'Stuffed with peri-peri sauce, pickled onions, jalapenos, marble cheese and herbs', 10.99, '[]', 3),
  (null, 'CMS', 'Trust your taste buds — they won''t fail you!', 9.99, '[{"kind":"pick","label":"Chef''s Pick"}]', 4),
  (null, 'Garlic Pav', 'Pav roasted with garlic butter stuffed with marble cheese, mayonnaise and herbs', 8.99, '[]', 5)
) as v(section, name, description, price, badges, sort_order) on true
where c.slug = 'pavs'
on conflict (category_id, name) do update set
  section = excluded.section, description = excluded.description,
  price = excluded.price, badges = excluded.badges,
  sort_order = excluded.sort_order, is_available = true;

-- ============================================================
-- items — loaded-fries
-- ============================================================
insert into public.items (category_id, section, name, description, price, badges, sort_order)
select c.id, v.section, v.name, v.description, v.price, v.badges::jsonb, v.sort_order
from public.categories c
join (values
  (null, 'Malai Makhni', 'Let''s keep that a secret', 12.99, '[]', 1),
  (null, 'Chilli Paneer', 'Fries mixed in marinated chilli paneer, cilantro, mayo and cheese', 12.99, '[]', 2),
  (null, 'Peri-Peri', 'Peri-peri sauce, cheese, olives, jalapenos, onions', 10.99, '[]', 3),
  (null, 'Indian Masala', 'Caramalised onion masala, Indian seasoning, cheese, mint sauce', 10.99, '[{"kind":"pick","label":"Chef''s Pick"},{"kind":"spicy","level":1,"label":"Spicy"}]', 4),
  (null, 'Chilli Garlic', 'Fries mixed in chilli garlic butter, cilantro, mayo and cheese', 10.99, '[{"kind":"pick","label":"Chef''s Pick"}]', 5)
) as v(section, name, description, price, badges, sort_order) on true
where c.slug = 'loaded-fries'
on conflict (category_id, name) do update set
  section = excluded.section, description = excluded.description,
  price = excluded.price, badges = excluded.badges,
  sort_order = excluded.sort_order, is_available = true;

-- ============================================================
-- items — seasoned-fries
-- ============================================================
insert into public.items (category_id, section, name, description, price, badges, sort_order)
select c.id, v.section, v.name, v.description, v.price, v.badges::jsonb, v.sort_order
from public.categories c
join (values
  (null, 'Peri-Peri', 'Please don''t ask, it is what the name says', 5.99, '[{"kind":"pick","label":"Chef''s Pick"}]', 1),
  (null, 'Indian Chaska', 'We take our fries seriously, try it before asking.', 5.99, '[{"kind":"pick","label":"Chef''s Pick"},{"kind":"spicy","level":1,"label":"Spicy"}]', 2),
  (null, 'Salt and Pepper', 'Name says it all, no catch', 4.99, '[]', 3)
) as v(section, name, description, price, badges, sort_order) on true
where c.slug = 'seasoned-fries'
on conflict (category_id, name) do update set
  section = excluded.section, description = excluded.description,
  price = excluded.price, badges = excluded.badges,
  sort_order = excluded.sort_order, is_available = true;

-- ============================================================
-- items — add-ons-dips
-- ============================================================
insert into public.items (category_id, section, name, description, price, badges, sort_order)
select c.id, v.section, v.name, v.description, v.price, v.badges::jsonb, v.sort_order
from public.categories c
join (values
  (null, 'Extra Sauce', null, 0.99, '[]', 1),
  (null, 'Extra Cheese', null, 0.99, '[]', 2),
  (null, 'Extra Fries', 'Not an option — won''t fit in the box', null, '[]', 3),
  (null, 'Peri-Peri Fries Upgrade', 'Upgrade your side to peri-peri fries — also includes a dip of your choice', 1.50, '[]', 4),
  (null, 'Indian Chaska Upgrade', 'Upgrade your side to Indian Chaska fries — also includes a dip of your choice', 1.50, '[]', 5),
  (null, 'Roasted Garlic Dip', null, 1.49, '[{"kind":"pick","label":"Chef''s Pick"}]', 6),
  (null, 'Peri-Peri Dip', null, 0.99, '[]', 7),
  (null, 'Mint-Mayo Dip', null, 0.99, '[{"kind":"pick","label":"Chef''s Pick"}]', 8),
  (null, 'Schezwan Dip', null, 0.99, '[]', 9),
  (null, 'CMS Classic Dip', null, 0.99, '[]', 10)
) as v(section, name, description, price, badges, sort_order) on true
where c.slug = 'add-ons-dips'
on conflict (category_id, name) do update set
  section = excluded.section, description = excluded.description,
  price = excluded.price, badges = excluded.badges,
  sort_order = excluded.sort_order, is_available = true;

-- ============================================================
-- items — eggless
-- ============================================================
insert into public.items (category_id, section, name, description, price, badges, sort_order)
select c.id, v.section, v.name, v.description, v.price, v.badges::jsonb, v.sort_order
from public.categories c
join (values
  (null, 'Paneer Chaska', 'Crispy paneer patty, caramalised onion masala, hint of pickled onions, mint mayo, marble cheese', 12.99, '[{"kind":"diet","label":"Eggless"}]', 1),
  (null, 'Veggie Paneer Delight', 'Crispy paneer patty, cilantro, jalapenos, pickled onions, olives, available veggies, signature burger sauce, marble cheese', 12.99, '[{"kind":"diet","label":"Eggless"}]', 2),
  (null, 'Paneer Makhani', 'Crispy paneer patty, onions, cilantro, cream, makhni gravy, crispy onions, green peppers, marble cheese', 11.99, '[{"kind":"diet","label":"Eggless"}]', 3),
  (null, 'Amdavadi Chaska', 'Aloo patty, caramalised onion masala, hint of pickled onions, mint mayo, marble cheese', 11.99, '[{"kind":"diet","label":"Eggless"}]', 4),
  (null, 'Veggie Delight', 'Aloo patty, cilantro, jalapenos, pickled onions, olives, available veggies, signature burger sauce and marble cheese', 11.99, '[{"kind":"diet","label":"Eggless"}]', 5),
  (null, 'Aloo Tikki', 'Aloo patty, caramalised onion masala, hint of pickled onions, mint mayo, marble cheese', 11.99, '[{"kind":"diet","label":"Eggless"}]', 6),
  (null, 'Aloo Makhani', 'Aloo patty, onions, cilantro, cream, makhni gravy, crispy onions, green peppers, marble cheese', 10.99, '[{"kind":"diet","label":"Eggless"}]', 7),
  (null, 'Amdavadi Chaska 2.0', 'Spicy aloo patty, caramalised onion masala, hint of pickled onions, signature burger sauce, marble cheese', 11.99, '[{"kind":"diet","label":"Eggless"}]', 8),
  (null, 'Achari Aloo', 'Spicy aloo patty, cilantro, pickled onions, crispy chips, mint mayo, marble cheese', 11.99, '[{"kind":"diet","label":"Eggless"}]', 9),
  (null, 'Cheese Chilli Garlic', 'Our twist to ghughra sandwich', 12.99, '[{"kind":"pick","label":"Chef''s Pick"},{"kind":"spicy","level":1,"label":"Spicy"},{"kind":"diet","label":"Eggless"}]', 10),
  (null, 'Cheese Chilli Onion', 'Tribute to the famous Hughes sandwich', 11.99, '[{"kind":"diet","label":"Eggless"}]', 11),
  (null, 'Classic Grill Cheese', 'With a twist: garlic butter, marble cheese and chat masala', 9.99, '[{"kind":"diet","label":"Eggless"}]', 12),
  (null, 'Cheese-Chutney', 'Our in-house spicy chutney with marble cheese!', 9.99, '[{"kind":"diet","label":"Eggless"}]', 13),
  (null, 'OG Aloo Frankie', 'Aloo patty, house veggie mix, ketchup X chutney, mint mayo, cheese X lays', 12.99, '[{"kind":"diet","label":"Eggless"}]', 14),
  (null, 'Achari Aloo Frankie', 'Spicy aloo patty, house veggie mix, ketchup X chutney, mint mayo, cheese X lays, squeeze of lemon', 12.99, '[{"kind":"diet","label":"Eggless"}]', 15),
  (null, 'Malai Makhni', 'Let''s keep that a secret', 12.99, '[{"kind":"diet","label":"Eggless"}]', 16),
  (null, 'Indian Masala', 'Caramalised onion masala, Indian seasoning, cheese, mint sauce', 11.99, '[{"kind":"pick","label":"Chef''s Pick"},{"kind":"spicy","level":1,"label":"Spicy"},{"kind":"diet","label":"Eggless"}]', 17),
  (null, 'Indian Chaska', 'We take our fries seriously, try it before asking.', 5.99, '[{"kind":"pick","label":"Chef''s Pick"},{"kind":"spicy","level":1,"label":"Spicy"},{"kind":"diet","label":"Eggless"}]', 18),
  (null, 'Salt and Pepper', 'Name says it all, no catch', 4.99, '[{"kind":"diet","label":"Eggless"}]', 19)
) as v(section, name, description, price, badges, sort_order) on true
where c.slug = 'eggless'
on conflict (category_id, name) do update set
  section = excluded.section, description = excluded.description,
  price = excluded.price, badges = excluded.badges,
  sort_order = excluded.sort_order, is_available = true;

-- ============================================================
-- items — jain
-- ============================================================
insert into public.items (category_id, section, name, description, price, badges, sort_order)
select c.id, v.section, v.name, v.description, v.price, v.badges::jsonb, v.sort_order
from public.categories c
join (values
  (null, 'Classic Grill Cheese', 'With a twist: butter, marble cheese and chat masala', 12.99, '[{"kind":"diet","label":"Jain"}]', 1),
  (null, 'Cheese Chutney', 'Our in-house spicy chutney with marble cheese!', 12.99, '[{"kind":"diet","label":"Jain"}]', 2),
  (null, 'Paneer Chaska', 'Crispy paneer patty, mint mayo, marble cheese', 12.99, '[{"kind":"diet","label":"Jain"}]', 3),
  (null, 'Veggie Paneer Delight', 'Crispy paneer patty, cilantro, jalapenos, olives, available veggies, signature burger sauce, marble cheese', 12.99, '[{"kind":"diet","label":"Jain"}]', 4),
  (null, 'Paneer Makhani', 'Crispy paneer patty, cilantro, cream, makhni gravy, green peppers, marble cheese', 11.99, '[{"kind":"diet","label":"Jain"}]', 5),
  (null, 'SP. Jain Frankie', 'You won''t know the difference. Same taste — unique ingredients', 12.99, '[{"kind":"diet","label":"Jain"}]', 6)
) as v(section, name, description, price, badges, sort_order) on true
where c.slug = 'jain'
on conflict (category_id, name) do update set
  section = excluded.section, description = excluded.description,
  price = excluded.price, badges = excluded.badges,
  sort_order = excluded.sort_order, is_available = true;

-- ============================================================
-- items — swaminarayan
-- ============================================================
insert into public.items (category_id, section, name, description, price, badges, sort_order)
select c.id, v.section, v.name, v.description, v.price, v.badges::jsonb, v.sort_order
from public.categories c
join (values
  (null, 'Classic Grill Cheese', 'With a twist: butter, marble cheese and chat masala', 12.99, '[{"kind":"diet","label":"Swaminarayan"}]', 1),
  (null, 'Cheese Chutney', 'Our in-house spicy chutney with marble cheese!', 12.99, '[{"kind":"diet","label":"Swaminarayan"}]', 2),
  (null, 'Paneer Chaska', 'Crispy paneer patty, onions, mint mayo, marble cheese', 12.99, '[{"kind":"diet","label":"Swaminarayan"}]', 3),
  (null, 'Veggie Paneer Delight', 'Crispy paneer patty, cilantro, jalapenos, olives, available veggies, marble cheese', 12.99, '[{"kind":"diet","label":"Swaminarayan"}]', 4),
  (null, 'Paneer Makhani', 'Crispy paneer patty, onions, cilantro, cream, makhni gravy, green peppers, marble cheese', 11.99, '[{"kind":"diet","label":"Swaminarayan"}]', 5),
  (null, 'Amdavadi Chaska', 'Aloo patty, mint mayo, marble cheese', 11.99, '[{"kind":"diet","label":"Swaminarayan"}]', 6),
  (null, 'Veggie Delight', 'Aloo patty, cilantro, jalapenos, olives, available veggies, signature burger sauce and marble cheese', 11.99, '[{"kind":"diet","label":"Swaminarayan"}]', 7),
  (null, 'Aloo Tikki', 'Aloo patty, mint mayo, marble cheese', 11.99, '[{"kind":"diet","label":"Swaminarayan"}]', 8),
  (null, 'Aloo Makhani', 'Aloo patty, cilantro, cream, makhni gravy, green peppers, marble cheese', 10.99, '[{"kind":"diet","label":"Swaminarayan"}]', 9),
  (null, 'OG Aloo Frankie', 'Aloo patty, house veggie mix, ketchup X chutney, mint mayo, cheese X lays', 12.99, '[{"kind":"diet","label":"Swaminarayan"}]', 10),
  (null, 'SP. Paneer Frankie', 'Trust the name, it''s actually special', 12.99, '[{"kind":"diet","label":"Swaminarayan"}]', 11)
) as v(section, name, description, price, badges, sort_order) on true
where c.slug = 'swaminarayan'
on conflict (category_id, name) do update set
  section = excluded.section, description = excluded.description,
  price = excluded.price, badges = excluded.badges,
  sort_order = excluded.sort_order, is_available = true;

-- ============================================================
-- remove placeholder items not on the printed menu
-- ============================================================
delete from public.items where category_id = (select id from public.categories where slug = 'frankies')
  and name in ('Paneer Frankie', 'Aloo Frankie', 'Schezwan Paneer Frankie');
delete from public.items where category_id = (select id from public.categories where slug = 'jain')
  and name in ('Jain Paneer Burger', 'Jain Pav', 'Jain Cheese Frankie');

-- ============================================================
-- site_content — editable copy (unchanged from launch)
-- ============================================================
insert into public.site_content (key, value) values
  ('announcement', '"Now slinging in Regina — 4306 Dewdney Avenue"'),
  ('phone',        '"(306) 541-9198"'),
  ('tel',          '"tel:+13065419198"'),
  ('address',      '"4306 Dewdney Avenue"'),
  ('city',         '"Regina, SK"'),
  ('instagram',    '{"handle": "@cheatmeals_yqr", "url": "https://instagram.com/cheatmeals_yqr"}'),
  ('about', '{
    "headline": ["OUR", "STORY"],
    "copy": "CheatMeals started with one belief: Regina deserved the burgers we grew up craving. Hand-smashed aloo tikkis, real paneer, sauces we won''t explain — now at 4306 Dewdney Avenue."
  }'),
  ('hours', '[
    {"day": "Monday",    "time": "11:00 AM – 9:00 PM"},
    {"day": "Tuesday",   "time": "11:00 AM – 9:00 PM"},
    {"day": "Wednesday", "time": "11:00 AM – 9:00 PM"},
    {"day": "Thursday",  "time": "11:00 AM – 9:00 PM"},
    {"day": "Friday",    "time": "11:00 AM – 9:00 PM"},
    {"day": "Saturday",  "time": "11:00 AM – 9:00 PM"},
    {"day": "Sunday",    "time": "11:00 AM – 9:00 PM"}
  ]'),
  ('team', '[
    {"name": "The Founder",       "bio": "Started this because Regina needed it."},
    {"name": "Head of Patties",   "bio": "Hand-smashes every tikki."},
    {"name": "Sauce Department",  "bio": "Knows the Malai Makhni secret. Won''t tell."}
  ]')
on conflict (key) do update set value = excluded.value;
