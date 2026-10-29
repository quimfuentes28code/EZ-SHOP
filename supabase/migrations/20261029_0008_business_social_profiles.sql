-- AutonoService: business social profiles, image/video posts and media storage.
-- Public content is opt-in by the business owner. A user's personal account
-- and private CRM remain independent from published business profile assets.
alter table public.organizations add column if not exists tagline text not null default '' check(length(tagline)<=180);
alter table public.organizations add column if not exists accent_color text not null default '#A47B53'
  check(accent_color ~ '^#[0-9A-Fa-f]{6}$');
alter table public.organizations add column if not exists avatar_url text not null default '' check(length(avatar_url)<=1024);
alter table public.organizations add column if not exists cover_url text not null default '' check(length(cover_url)<=1024);

create table if not exists public.business_posts(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 body text not null default '' check(length(body)<=3000),
 media_url text not null default '' check(length(media_url)<=1024),
 media_kind text check(media_kind in ('image','video')),
 published boolean not null default false,
 created_at timestamptz not null default now(),
 constraint business_post_has_content check(length(btrim(body))>0 or length(media_url)>0),
 constraint business_post_media_consistency check(
  (media_url='' and media_kind is null) or (media_url<>'' and media_kind is not null))
);
create index if not exists business_posts_feed_idx on public.business_posts(organization_id,created_at desc);
alter table public.business_posts enable row level security;
revoke all on public.business_posts from anon,authenticated;
grant select on public.business_posts to anon,authenticated;
grant insert,update,delete on public.business_posts to authenticated;
create policy published_or_owner_posts on public.business_posts for select to anon,authenticated
using(
 (published and exists(select 1 from public.organizations o where o.id=organization_id and o.published))
 or exists(select 1 from public.organizations o join public.account_types a
  on a.user_id=o.owner_id and a.account_type='business'
  where o.id=organization_id and o.owner_id=(select auth.uid()))
);
create policy owner_create_posts on public.business_posts for insert to authenticated
with check(exists(select 1 from public.organizations o join public.account_types a
 on a.user_id=o.owner_id and a.account_type='business'
 where o.id=organization_id and o.owner_id=(select auth.uid())));
create policy owner_edit_posts on public.business_posts for update to authenticated
using(exists(select 1 from public.organizations o join public.account_types a
 on a.user_id=o.owner_id and a.account_type='business'
 where o.id=organization_id and o.owner_id=(select auth.uid())))
with check(exists(select 1 from public.organizations o join public.account_types a
 on a.user_id=o.owner_id and a.account_type='business'
 where o.id=organization_id and o.owner_id=(select auth.uid())));
create policy owner_remove_posts on public.business_posts for delete to authenticated
using(exists(select 1 from public.organizations o join public.account_types a
 on a.user_id=o.owner_id and a.account_type='business'
 where o.id=organization_id and o.owner_id=(select auth.uid())));

-- A public bucket is appropriate only for media the company explicitly
-- chooses to publish. Do not upload private client chats or deliveries here.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('autonoservice-public-media','autonoservice-public-media',true,20971520,
array['image/jpeg','image/png','image/webp','video/mp4','video/webm'])
on conflict(id) do nothing;
-- Uploaded paths always start with the owning organization UUID.
create policy autonoservice_media_owner_insert on storage.objects for insert to authenticated
with check(
 bucket_id='autonoservice-public-media'
 and split_part(name,'/',1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
 and exists(select 1 from public.organizations o join public.account_types a
   on a.user_id=o.owner_id and a.account_type='business'
   where o.id=split_part(name,'/',1)::uuid and o.owner_id=(select auth.uid()))
);
create policy autonoservice_media_owner_select on storage.objects for select to authenticated
using(bucket_id='autonoservice-public-media'
 and split_part(name,'/',1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
 and exists(select 1 from public.organizations o join public.account_types a
   on a.user_id=o.owner_id and a.account_type='business'
   where o.id=split_part(name,'/',1)::uuid and o.owner_id=(select auth.uid())));
