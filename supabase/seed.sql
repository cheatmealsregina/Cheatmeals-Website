-- CheatMeals — seed data
-- Generated from public/scripts/data.js (the design-brief seed data).
-- Every word is real brand copy — no lorem ipsum.

-- ============================================================
-- categories (tab order from the brief)
-- ============================================================
insert into public.categories (name, slug, sort_order, note, is_dietary) values
  ('Aloo Burgers',    'aloo-burgers',    1, 'We make our own patties. All burgers are served with a side of fries, chips, Doritos, or Cheetos.', false),
  ('Paneer Burgers',  'paneer-burgers',  2, null, false),
  ('Frankies',        'frankies',        3, 'Honest advice: one''s enough for most people', false),
  ('Sand-Witches',    'sand-witches',    4, 'It''s not actual witchcraft, but it will possess you', false),
  ('Pavs',            'pavs',            5, null, false),
  ('Loaded Fries',    'loaded-fries',    6, 'Matches your taste better than your ex', false),
  ('Seasoned Fries',  'seasoned-fries',  7, null, false),
  ('Add-Ons & Dips',  'add-ons-dips',    8, null, false),
  ('Eggless',         'eggless',         9, null, true),
  ('Jain',            'jain',           10, 'No root vegetables, no onion, no garlic', true),
  ('Swaminarayan',    'swaminarayan',   11, null, true);

-- ============================================================
-- items — Aloo Burgers (fully populated in the brief)
-- ============================================================
insert into public.items (category_id, section, name, description, price, badges, sort_order)
select c.id, v.section, v.name, v.description, v.price, v.badges::jsonb, v.sort_order
from public.categories c
join (values
  -- DOUBLE Patty
  ('DOUBLE',     'The Red Hulk',         'Double aloo patty, double cheese, schezwan chutney and mayo, cilantro, onions and jalapenos', 14.99, '[{"kind":"pick","label":"Chef''s Pick"},{"kind":"spicy","level":1,"label":"Spicy"}]', 1),
  -- SPICY ALOO Patty
  ('SPICY ALOO', 'Aloo Anarkali',        null, 12.99, '[{"kind":"pick","label":"Chef''s Pick"},{"kind":"spicy","level":1,"label":"Spicy"}]', 2),
  ('SPICY ALOO', 'Aloo 420',             null, 11.99, '[]', 3),
  ('SPICY ALOO', 'Amdavadi Chaska 2.0',  null, 11.99, '[]', 4),
  ('SPICY ALOO', 'Masala Aloo Tikki',    null, 10.99, '[{"kind":"spicy","level":1,"label":"Spicy"}]', 5),
  ('SPICY ALOO', 'Achari Aloo',          null,  9.99, '[]', 6),
  -- ALOO Patty
  ('ALOO',       'Red Devil',            null, 12.99, '[{"kind":"spicy","level":2,"label":"Extra Spicy"}]', 7),
  ('ALOO',       'Veggie Delight',       'Please don''t ask, it is what the name says', 11.99, '[]', 8),
  ('ALOO',       'Schezwan Aloo Tikki',  null, 10.99, '[{"kind":"pick","label":"Chef''s Pick"},{"kind":"spicy","level":1,"label":"Spicy"}]', 9),
  ('ALOO',       'Aloo Makhni',          'Let''s keep that a secret', 10.99, '[]', 10),
  ('ALOO',       'Amdavadi Chaska',      null, 10.99, '[{"kind":"pick","label":"Chef''s Pick"}]', 11),
  ('ALOO',       'Peri-Peri',            null, 10.99, '[]', 12),
  ('ALOO',       'Aloo Tikki',           null,  9.99, '[]', 13)
) as v(section, name, description, price, badges, sort_order) on true
where c.slug = 'aloo-burgers';

-- ============================================================
-- items — Frankies
-- ============================================================
insert into public.items (category_id, name, price, badges, sort_order)
select c.id, v.name, v.price, v.badges::jsonb, v.sort_order
from public.categories c
join (values
  ('Paneer Frankie',          11.99, '[{"kind":"spicy","level":1,"label":"Spicy"}]', 1),
  ('Aloo Frankie',             9.99, '[]', 2),
  ('Schezwan Paneer Frankie', 12.99, '[{"kind":"spicy","level":2,"label":"Extra Spicy"}]', 3)
) as v(name, price, badges, sort_order) on true
where c.slug = 'frankies';

-- ============================================================
-- items — Jain (separate curated menu)
-- ============================================================
insert into public.items (category_id, name, price, badges, sort_order)
select c.id, v.name, v.price, v.badges::jsonb, v.sort_order
from public.categories c
join (values
  ('Jain Paneer Burger', 12.99, '[{"kind":"diet","label":"Jain"}]', 1),
  ('Jain Pav',            8.99, '[{"kind":"diet","label":"Jain"}]', 2),
  ('Jain Cheese Frankie', 10.99, '[{"kind":"diet","label":"Jain"}]', 3)
) as v(name, price, badges, sort_order) on true
where c.slug = 'jain';

-- ============================================================
-- items — the price-null joke card (renders as "N/A")
-- ============================================================
insert into public.items (category_id, name, description, price, badges, sort_order)
select c.id, 'Extra Fries', 'Not an option — won''t fit in the box', null, '[]'::jsonb, 1
from public.categories c
where c.slug = 'add-ons-dips';

-- ============================================================
-- site_content
-- ============================================================
insert into public.site_content (key, value) values
  ('announcement', '"Now slinging in Regina — 87 Hanbidge Crescent"'),
  ('phone',        '"(306) 541-9198"'),
  ('tel',          '"tel:+13065419198"'),
  ('address',      '"87 Hanbidge Crescent"'),
  ('city',         '"Regina, SK"'),
  ('instagram',    '{"handle": "@cheatmeals_yqr", "url": "https://instagram.com/cheatmeals_yqr"}'),
  ('whatsapp',     '{"label": "Join our WhatsApp foodie hub", "url": "https://wa.me/13065419198"}'),
  ('about', '{
    "headline": ["OUR", "STORY"],
    "copy": "CheatMeals started with one belief: Regina deserved the burgers we grew up craving. Hand-smashed aloo tikkis, real paneer, sauces we won''t explain — now at 87 Hanbidge Crescent."
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
  ]');
