-- Public media remain directly addressable even if a business_post is
-- hidden. Allow authorized owners to delete their own uploaded files so the
-- app can clean up assets when a post is deleted.
create policy autonoservice_media_owner_delete on storage.objects
for delete to authenticated
using (
  bucket_id='autonoservice-public-media'
  and exists (
    select 1 from public.organizations o
    join public.account_types a
      on a.user_id=o.owner_id and a.account_type='business'
    where o.id=(
      case when split_part(storage.objects.name,'/',1) ~*
        '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then split_part(storage.objects.name,'/',1)::uuid end
    )
    and o.owner_id=(select auth.uid())
  )
);
