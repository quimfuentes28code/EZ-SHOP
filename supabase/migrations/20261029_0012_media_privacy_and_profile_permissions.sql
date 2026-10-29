-- Apply after 0011, together with the frontend supporting signed business media.
-- Prepared for review only: this file does not execute against a remote project.
begin;

grant update(tagline,accent_color,avatar_url,cover_url) on public.organizations to authenticated;

-- Existing public SELECT policies reference account_types in their owner branch.
-- SQL privileges are checked even when the published branch matches. Anon needs
-- SELECT permission, but no anon RLS policy exists: it still reads zero rows.
grant select on public.account_types to anon;

drop policy if exists services_read on public.organization_services;
create policy services_read on public.organization_services for select to authenticated,anon
using (exists (
  select 1 from public.organizations o
  where o.id=organization_services.organization_id and (
    (o.published and organization_services.active)
    or (o.owner_id=(select auth.uid()) and exists(
      select 1 from public.account_types a
      where a.user_id=(select auth.uid()) and a.account_type='business'
    ))
  )
));

-- Keep the bucket ID and existing objects/URLs for compatibility, but public
-- download URLs must cease granting access independently of publication state.
update storage.buckets set public=false where id='autonoservice-public-media';

-- A new frontend must fail closed if the storage migration has not been applied.
-- Expose only this boolean, never bucket credentials or administrative metadata.
create or replace function public.autonoservice_business_media_private()
returns boolean language sql stable security definer set search_path=''
as $$
  select exists(select 1 from storage.buckets b
    where b.id='autonoservice-public-media' and not b.public);
$$;
revoke all on function public.autonoservice_business_media_private() from public,anon;
grant execute on function public.autonoservice_business_media_private() to authenticated;

-- Parser for durable references and URLs persisted before this migration.
-- This is a pure parser, not a privileged authorization function.
create or replace function public.autonoservice_business_media_path(reference text)
returns text language sql immutable set search_path=''
as $$
  select case
    when reference like 'storage://autonoservice-public-media/%'
      then substr(reference,length('storage://autonoservice-public-media/')+1)
    else substring(reference from '^https?://[^/]+/storage/v1/object/(?:public|authenticated|sign)/autonoservice-public-media/([^?#]+)')
  end;
$$;
revoke all on function public.autonoservice_business_media_path(text) from public;
grant execute on function public.autonoservice_business_media_path(text) to anon,authenticated;

drop policy if exists autonoservice_media_owner_insert on storage.objects;
drop policy if exists autonoservice_media_owner_select on storage.objects;
create policy autonoservice_media_owner_insert on storage.objects for insert to authenticated
with check(
  bucket_id='autonoservice-public-media'
  and exists(select 1 from public.organizations o join public.account_types a
    on a.user_id=o.owner_id and a.account_type='business'
    where o.id::text=split_part(storage.objects.name,'/',1)
      and o.owner_id=(select auth.uid()))
);
create policy autonoservice_media_owner_select on storage.objects for select to authenticated
using(
  bucket_id='autonoservice-public-media'
  and exists(select 1 from public.organizations o join public.account_types a
    on a.user_id=o.owner_id and a.account_type='business'
    where o.id::text=split_part(storage.objects.name,'/',1)
      and o.owner_id=(select auth.uid()))
);

-- Signing a URL requires a current public reference, not just a guessed path.
-- Short-lived URLs already issued can remain valid up to their 60-second TTL.
create policy autonoservice_media_published_select on storage.objects for select to anon,authenticated
using(
  bucket_id='autonoservice-public-media'
  and exists(select 1 from public.organizations o
    where o.id::text=split_part(storage.objects.name,'/',1) and o.published and (
      public.autonoservice_business_media_path(o.avatar_url)=storage.objects.name
      or public.autonoservice_business_media_path(o.cover_url)=storage.objects.name
      or exists(select 1 from public.business_posts p
        where p.organization_id=o.id and p.published
          and public.autonoservice_business_media_path(p.media_url)=storage.objects.name)
    ))
);

-- Cleanup only unreferenced objects belonging to this owner's organization.
-- A shared reference must never be removed as a side effect of editing a post.
create policy autonoservice_media_owner_delete_unused on storage.objects for delete to authenticated
using(
  bucket_id='autonoservice-public-media'
  and exists(select 1 from public.organizations o join public.account_types a
    on a.user_id=o.owner_id and a.account_type='business'
    where o.id::text=split_part(storage.objects.name,'/',1)
      and o.owner_id=(select auth.uid())
      and public.autonoservice_business_media_path(o.avatar_url) is distinct from storage.objects.name
      and public.autonoservice_business_media_path(o.cover_url) is distinct from storage.objects.name
      and not exists(select 1 from public.business_posts p
        where p.organization_id=o.id
          and public.autonoservice_business_media_path(p.media_url)=storage.objects.name))
);

-- Message order/read cursors must use database time even if an API caller
-- supplies created_at. Preserve existing history; normalize only new messages.
create or replace function public.autonoservice_message_timestamp()
returns trigger language plpgsql set search_path=''
as $$
begin
  new.created_at := clock_timestamp();
  return new;
end;
$$;
drop trigger if exists autonoservice_message_server_timestamp on public.conversation_messages;
create trigger autonoservice_message_server_timestamp
before insert on public.conversation_messages for each row
execute function public.autonoservice_message_timestamp();
revoke all on function public.autonoservice_message_timestamp() from public,anon,authenticated;

commit;
