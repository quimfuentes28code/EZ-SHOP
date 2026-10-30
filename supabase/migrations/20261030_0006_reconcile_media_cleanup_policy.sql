-- Generated with `supabase migration new reconcile_media_cleanup_policy`, then
-- renamed to follow this repository's legacy migration order. The audit branch
-- introduced a permissive DELETE policy after the private-media migration.
-- Remove that alternative so references still protect shared media objects.
begin;
drop policy if exists autonoservice_media_owner_delete on storage.objects;
commit;
