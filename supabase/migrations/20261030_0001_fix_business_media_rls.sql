-- Fix uploaded company logos / covers / posts returning HTTP 400.
-- Original policy used unqualified "name" inside a correlated subquery.
-- PostgreSQL resolved it as organizations.name (e.g. RedMoonStudios),
-- then attempted to cast that business NAME to UUID.
-- The path is always taken from the OUTER storage.objects row instead.
-- CASE also prevents invalid UUID casts for unrelated bucket paths.
drop policy if exists autonoservice_media_owner_insert on storage.objects;
drop policy if exists autonoservice_media_owner_select on storage.objects;

create policy autonoservice_media_owner_insert on storage.objects
for insert to authenticated
with check (
  bucket_id='autonoservice-public-media'
  and exists (
    select 1 from public.organizations o
    join public.account_types a
      on a.user_id=o.owner_id and a.account_type='business'
    where o.id = (
      case when split_part(storage.objects.name,'/',1) ~*
        '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then split_part(storage.objects.name,'/',1)::uuid end
    )
    and o.owner_id=(select auth.uid())
  )
);

create policy autonoservice_media_owner_select on storage.objects
for select to authenticated
using (
  bucket_id='autonoservice-public-media'
  and exists (
    select 1 from public.organizations o
    join public.account_types a
      on a.user_id=o.owner_id and a.account_type='business'
    where o.id = (
      case when split_part(storage.objects.name,'/',1) ~*
        '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then split_part(storage.objects.name,'/',1)::uuid end
    )
    and o.owner_id=(select auth.uid())
  )
);
