-- Identities and businesses are fictional. Only the disposable database is used.
insert into auth.users(id,email,raw_user_meta_data) values
 ('11111111-1111-4111-8111-111111111111','owner-a@example.invalid','{"account_type":"business","first_name":"Owner A"}'),
 ('22222222-2222-4222-8222-222222222222','owner-b@example.invalid','{"account_type":"business","first_name":"Owner B"}'),
 ('33333333-3333-4333-8333-333333333333','customer@example.invalid','{"account_type":"customer","first_name":"Customer"}');

set role authenticated;
set request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
select test.assert_true(public.autonoservice_business_media_private(),
 'Authenticated upload readiness confirms private storage');
insert into public.organizations(id,owner_id,name,published) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',auth.uid(),'Photography A',true);
update public.organizations set tagline='A tagline',accent_color='#C7A075',
 avatar_url='storage://autonoservice-public-media/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/avatar.jpg',
 cover_url='https://project.example.invalid/storage/v1/object/public/autonoservice-public-media/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/cover.jpg'
 where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
select test.assert_true((select tagline='A tagline' and accent_color='#C7A075'
 from public.organizations where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
 'Owner can update the four visual identity columns');
insert into public.organization_services(organization_id,title,active) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Active service',true),
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Hidden service',false);
select test.assert_true((select count(*)=2 from public.organization_services),
 'Owner can read active and inactive own services');
insert into storage.objects(bucket_id,name,owner_id) values
 ('autonoservice-public-media','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/avatar.jpg',auth.uid()::text),
 ('autonoservice-public-media','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/cover.jpg',auth.uid()::text),
 ('autonoservice-public-media','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/draft.jpg',auth.uid()::text),
 ('autonoservice-public-media','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/unused.jpg',auth.uid()::text);
select test.assert_true((select count(*)=4 from storage.objects),
 'A normal business name can upload and read its own media');
select test.expect_denied($statement$insert into storage.objects(bucket_id,name,owner_id)
 values('autonoservice-public-media','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/spoof.jpg',auth.uid()::text)$statement$,
 'Owner cannot upload media into a foreign business folder');
insert into public.business_posts(id,organization_id,body,media_url,media_kind,published) values
 ('dddddddd-dddd-4ddd-8ddd-dddddddddddd','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Private draft',
 'storage://autonoservice-public-media/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/draft.jpg','image',false);

reset role;
set role authenticated;
set request.jwt.claim.sub='22222222-2222-4222-8222-222222222222';
insert into public.organizations(id,owner_id,name,published) values
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',auth.uid(),'Business B',true);
select test.assert_true((select count(*)=0 from public.business_posts),
 'Another owner cannot read draft publications');
select test.assert_true((select count(*)=2 from storage.objects),
 'Another owner sees published profile media only');
select test.assert_true((select count(*)=1 from public.organization_services),
 'Another owner cannot read inactive services');
select test.expect_denied($statement$insert into storage.objects(bucket_id,name)
 values('autonoservice-public-media','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/foreign.jpg')$statement$,
 'Another owner cannot upload to the first business folder');
update public.organizations set tagline='Tampered' where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
select test.assert_true((select tagline='A tagline' from public.organizations
 where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
 'Another owner cannot update public profile fields');
delete from storage.objects where name='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/avatar.jpg';
select test.assert_true((select count(*)=2 from storage.objects),
 'Another owner cannot delete published profile media');

reset role;
set role anon;
set request.jwt.claim.sub='';
select test.expect_denied('select public.autonoservice_business_media_private()',
 'Anonymous clients cannot invoke upload readiness RPC');
select test.assert_true((select count(*)=2 from public.organizations),
 'Anonymous discovery can read published businesses');
select test.assert_true((select count(*)=0 from public.account_types),
 'Anonymous role cannot discover private account memberships');
select test.assert_true((select count(*)=1 from public.organization_services),
 'Anonymous discovery exposes active services only');
select test.assert_true((select count(*)=0 from public.business_posts),
 'Anonymous discovery cannot read draft posts');
select test.assert_true((select count(*)=2 from storage.objects),
 'Public profile references, including legacy URLs, authorize media reads');
select test.assert_true((select count(*)=0 from storage.objects
 where name like '%/draft.jpg' or name like '%/unused.jpg'),
 'Draft and unreferenced media are inaccessible anonymously');

reset role;
set role authenticated;
set request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
update public.organizations set name='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
 where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
select test.expect_denied($statement$insert into storage.objects(bucket_id,name)
 values('autonoservice-public-media','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/name-spoof.jpg')$statement$,
 'Changing the business name to a UUID does not bypass folder ownership');
delete from storage.objects where name='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/draft.jpg';
select test.assert_true((select count(*)=1 from storage.objects where name like '%/draft.jpg'),
 'A draft reference prevents accidental deletion of its shared media');
delete from storage.objects where name='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/unused.jpg';
select test.assert_true((select count(*)=0 from storage.objects where name like '%/unused.jpg'),
 'Owner can remove unreferenced uploaded media');
update public.business_posts set published=true where id='dddddddd-dddd-4ddd-8ddd-dddddddddddd';

reset role;
set role anon;
set request.jwt.claim.sub='';
select test.assert_true((select count(*)=1 from public.business_posts),
 'A published post is visible in discovery');
select test.assert_true((select count(*)=1 from storage.objects where name like '%/draft.jpg'),
 'Publishing a post permits access to its media');

reset role;
set role authenticated;
set request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
update public.business_posts set published=false where id='dddddddd-dddd-4ddd-8ddd-dddddddddddd';

reset role;
set role anon;
set request.jwt.claim.sub='';
select test.assert_true((select count(*)=0 from storage.objects where name like '%/draft.jpg'),
 'Making a post private prevents issuing new media read grants');

reset role;
set role authenticated;
set request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
delete from public.business_posts where id='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
delete from storage.objects where name='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/draft.jpg';
select test.assert_true((select count(*)=0 from storage.objects where name like '%/draft.jpg'),
 'Owner can clean up a deleted post media object');
update public.organizations set published=false where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

reset role;
set role anon;
set request.jwt.claim.sub='';
select test.assert_true((select count(*)=0 from storage.objects),
 'Unpublishing a business removes public access to its profile media');
select test.assert_true((select count(*)=1 from public.organizations),
 'Anonymous discovery cannot read an unpublished business');

reset role;
select test.assert_true((select not public from storage.buckets where id='autonoservice-public-media'),
 'The legacy public-media bucket is private after migration');
select test.assert_true((select count(*)=3 from auth.users),
 'Migrating and checking policies preserves user identities');
