-- Synthetic, self-contained publication journey. This runs only in the local
-- disposable PostgreSQL runner; it does not emulate Auth/Storage HTTP or tiles.
begin;
reset role;
insert into auth.users(id,email,raw_user_meta_data) values
 ('71000000-0000-4000-8000-000000000001','location-owner-a@example.invalid','{"account_type":"business","first_name":"Location A"}'),
 ('72000000-0000-4000-8000-000000000002','location-owner-b@example.invalid','{"account_type":"business","first_name":"Location B"}'),
 ('73000000-0000-4000-8000-000000000003','location-customer@example.invalid','{"account_type":"customer","first_name":"Location Customer"}');

set role authenticated;
set request.jwt.claim.sub='71000000-0000-4000-8000-000000000001';
insert into public.organizations(id,owner_id,name,published) values
 ('a1000000-0000-4000-8000-000000000001',auth.uid(),'Private company QA',false);
update public.organization_locations set name='Public pin A',city='Terrassa',published=true,
 latitude=41.563211,longitude=2.008755
 where organization_id='a1000000-0000-4000-8000-000000000001' and is_primary;
insert into public.organization_locations(organization_id,name,city,published,latitude,longitude) values
 ('a1000000-0000-4000-8000-000000000001','Private branch A','Barcelona',false,41.38,2.17);
insert into public.organization_services(organization_id,title,active) values
 ('a1000000-0000-4000-8000-000000000001','Retained service QA',true);
select test.assert_true((select count(*)=2 from public.organization_locations
 where organization_id='a1000000-0000-4000-8000-000000000001'),
 'The owner can create and read both private and publication-ready branches');

reset role;
set role authenticated;
set request.jwt.claim.sub='72000000-0000-4000-8000-000000000002';
insert into public.organizations(id,owner_id,name,published) values
 ('b1000000-0000-4000-8000-000000000002',auth.uid(),'Public company QA',true);
insert into public.organization_locations(organization_id,name,city,published,latitude,longitude) values
 ('b1000000-0000-4000-8000-000000000002','Public pin B','Girona',true,41.98,2.82);
select test.assert_true((select count(*)=2 from public.organization_locations
 where organization_id='b1000000-0000-4000-8000-000000000002'),
 'The second owner sees its private primary branch and its published branch');
select test.assert_true((select count(*)=0 from public.organization_locations
 where organization_id='a1000000-0000-4000-8000-000000000001'),
 'A published branch of a private company is hidden from another owner');

reset role;
set role authenticated;
set request.jwt.claim.sub='73000000-0000-4000-8000-000000000003';
select test.assert_true((select count(*)=1 from public.organizations
 where id in ('a1000000-0000-4000-8000-000000000001','b1000000-0000-4000-8000-000000000002')),
 'Customer discovery returns the public company only');
select test.assert_true((select count(*)=1 and bool_and(name='Public pin B' and latitude=41.98 and longitude=2.82)
 from public.organization_locations
 where organization_id in ('a1000000-0000-4000-8000-000000000001','b1000000-0000-4000-8000-000000000002')),
 'Customer discovery requires both company and branch consent and preserves coordinates');
select test.expect_denied($statement$insert into public.organization_locations(organization_id,name)
 values('b1000000-0000-4000-8000-000000000002','Forged customer branch')$statement$,
 'A customer cannot create a branch in a published company');
with changed as (update public.organization_locations set name='Tampered by customer'
 where organization_id='b1000000-0000-4000-8000-000000000002' returning id)
select test.assert_true((select count(*)=0 from changed),
 'A customer cannot edit a published location');
with removed as (delete from public.organization_locations
 where organization_id='b1000000-0000-4000-8000-000000000002' returning id)
select test.assert_true((select count(*)=0 from removed),
 'A customer cannot delete a published location');

reset role;
set role anon;
set request.jwt.claim.sub='';
select test.assert_true((select count(*)=0 from public.account_types),
 'Anonymous policy evaluation exposes no account memberships');
select test.assert_true((select count(*)=1 from public.organizations
 where id in ('a1000000-0000-4000-8000-000000000001','b1000000-0000-4000-8000-000000000002')),
 'Anonymous company discovery succeeds without account_types permission errors');
select test.assert_true((select count(*)=1 and bool_and(name='Public pin B') from public.organization_locations
 where organization_id in ('a1000000-0000-4000-8000-000000000001','b1000000-0000-4000-8000-000000000002')),
 'Anonymous location discovery hides unpublished branches and private companies');
select test.expect_denied($statement$update public.organization_locations set published=false
 where organization_id='b1000000-0000-4000-8000-000000000002'$statement$,
 'Anonymous clients have no permission to change publication');
select test.expect_denied($statement$delete from public.organization_locations
 where organization_id='b1000000-0000-4000-8000-000000000002'$statement$,
 'Anonymous clients have no delete privilege on locations');

reset role;
set role authenticated;
set request.jwt.claim.sub='71000000-0000-4000-8000-000000000001';
update public.organizations set published=true where id='a1000000-0000-4000-8000-000000000001';
select test.assert_true((select published from public.organizations
 where id='a1000000-0000-4000-8000-000000000001'),
 'Only an explicit owner update publishes the company');

reset role;
set role authenticated;
set request.jwt.claim.sub='73000000-0000-4000-8000-000000000003';
select test.assert_true((select count(*)=2 from public.organizations
 where id in ('a1000000-0000-4000-8000-000000000001','b1000000-0000-4000-8000-000000000002')),
 'The newly published company becomes discoverable to Customer');
select test.assert_true((select count(*)=2 and bool_and(published and latitude is not null and longitude is not null)
 from public.organization_locations
 where organization_id in ('a1000000-0000-4000-8000-000000000001','b1000000-0000-4000-8000-000000000002')),
 'Published companies expose only their explicitly published branches');
select test.assert_true((select count(*)=0 from public.organization_locations
 where organization_id='a1000000-0000-4000-8000-000000000001' and name='Private branch A'),
 'Publishing the company does not publish a private branch');

reset role;
set role authenticated;
set request.jwt.claim.sub='72000000-0000-4000-8000-000000000002';
with changed as (update public.organization_locations set name='Tampered by another owner'
 where organization_id='a1000000-0000-4000-8000-000000000001' returning id)
select test.assert_true((select count(*)=0 from changed),
 'Another business owner cannot edit the visible public branch');
with removed as (delete from public.organization_locations
 where organization_id='a1000000-0000-4000-8000-000000000001' returning id)
select test.assert_true((select count(*)=0 from removed),
 'Another business owner cannot delete the visible public branch');
select test.expect_denied($statement$insert into public.organization_locations(organization_id,name)
 values('a1000000-0000-4000-8000-000000000001','Forged foreign branch')$statement$,
 'Another business owner cannot create branches under a foreign organization_id');

reset role;
set role authenticated;
set request.jwt.claim.sub='71000000-0000-4000-8000-000000000001';
update public.organization_locations set published=false
 where organization_id='a1000000-0000-4000-8000-000000000001' and name='Public pin A';
reset role;
set role authenticated;
set request.jwt.claim.sub='73000000-0000-4000-8000-000000000003';
select test.assert_true((select count(*)=0 from public.organization_locations
 where organization_id='a1000000-0000-4000-8000-000000000001'),
 'Withdrawing branch consent removes the branch from Customer discovery');
select test.assert_true((select count(*)=1 from public.organizations
 where id='a1000000-0000-4000-8000-000000000001'),
 'Withdrawing a branch does not hide the published company profile');

reset role;
set role authenticated;
set request.jwt.claim.sub='71000000-0000-4000-8000-000000000001';
update public.organization_locations set published=true
 where organization_id='a1000000-0000-4000-8000-000000000001' and name='Public pin A';
update public.organizations set published=false where id='a1000000-0000-4000-8000-000000000001';
reset role;
set role authenticated;
set request.jwt.claim.sub='73000000-0000-4000-8000-000000000003';
select test.assert_true((select count(*)=0 from public.organization_locations
 where organization_id='a1000000-0000-4000-8000-000000000001'),
 'Withdrawing company consent hides even a published branch with valid coordinates');

reset role;
set role authenticated;
set request.jwt.claim.sub='71000000-0000-4000-8000-000000000001';
with removed as (delete from public.organization_locations
 where organization_id='a1000000-0000-4000-8000-000000000001' and name='Public pin A' returning id)
select test.assert_true((select count(*)=1 from removed),
 'The owner can delete its own branch even while the company is private');
select test.assert_true((select count(*)=1 from public.organization_locations
 where organization_id='a1000000-0000-4000-8000-000000000001' and name='Private branch A'),
 'Deleting a branch preserves the other branches');
select test.assert_true((select count(*)=1 from public.organizations
 where id='a1000000-0000-4000-8000-000000000001'),
 'Deleting a branch preserves the parent company');
select test.assert_true((select count(*)=1 from public.organization_services
 where organization_id='a1000000-0000-4000-8000-000000000001' and title='Retained service QA'),
 'Deleting a branch preserves its company service catalog');

reset role;
rollback;
