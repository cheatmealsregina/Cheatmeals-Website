-- Storage bucket for menu item photos.
-- Public bucket: anyone can view photos (they render on the public menu);
-- only authenticated staff can upload, replace, or remove them.
insert into storage.buckets (id, name, public)
values ('menu-photos', 'menu-photos', true)
on conflict (id) do nothing;

create policy "public read menu photos"
  on storage.objects for select
  using (bucket_id = 'menu-photos');

create policy "staff insert menu photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'menu-photos');

create policy "staff update menu photos"
  on storage.objects for update to authenticated
  using (bucket_id = 'menu-photos')
  with check (bucket_id = 'menu-photos');

create policy "staff delete menu photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'menu-photos');
