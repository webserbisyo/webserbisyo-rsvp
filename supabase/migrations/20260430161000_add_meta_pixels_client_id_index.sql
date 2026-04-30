create index if not exists meta_pixels_client_id_idx
  on public.meta_pixels (client_id)
  where client_id is not null;
