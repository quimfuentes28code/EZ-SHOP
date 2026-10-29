-- Optional precise map points, placed voluntarily by the business owner.
-- Existing branches remain coordinate-free until their owner sets a position.
alter table public.organization_locations
 add column if not exists latitude double precision check (latitude between -90 and 90),
 add column if not exists longitude double precision check (longitude between -180 and 180);
alter table public.organization_locations
 add constraint location_coordinates_paired check ((latitude is null)=(longitude is null));
grant insert(latitude,longitude),update(latitude,longitude)
 on public.organization_locations to authenticated;
