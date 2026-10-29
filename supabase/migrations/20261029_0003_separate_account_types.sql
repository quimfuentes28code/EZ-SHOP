-- AutonoService: distinct and immutable account types.
-- Business and Cliente are separate Auth accounts; registering an account as one
-- type does not grant access to the other private workspace.
-- For pre-existing (untyped) accounts, the owner may make a ONE-TIME choice.
create table if not exists public.account_types (
  user_id uuid primary key references auth.users(id) on delete cascade,
  account_type text not null check (account_type in ('business','customer')),
  created_at timestamptz not null default now()
);
alter table public.account_types enable row level security;
revoke all on public.account_types from anon, authenticated;
grant select,insert(user_id,account_type) on public.account_types to authenticated;

create policy account_type_own_read on public.account_types
for select to authenticated using (user_id=(select auth.uid()));

-- INSERT allows a legacy account without an account_type to select ONE type.
-- No UPDATE or DELETE is granted, and the PRIMARY KEY prevents reassignment.
create policy account_type_own_enroll on public.account_types
for insert to authenticated with check (user_id=(select auth.uid()));

-- A signup's metadata chooses enrollment once, at creation time. It is NOT
-- consulted afterwards for authorization (user_metadata is user-editable).
create or replace function public.autonoservice_enroll_new_user()
returns trigger language plpgsql security definer set search_path=''
as $$
declare
  desired text;
begin
  desired := new.raw_user_meta_data->>'account_type';
  if desired in ('business','customer') then
    insert into public.account_types(user_id,account_type)
    values (new.id,desired) on conflict (user_id) do nothing;
  end if;
  return new;
end; $$;
drop trigger if exists autonoservice_auth_account_type_created on auth.users;
create trigger autonoservice_auth_account_type_created
after insert on auth.users for each row
execute function public.autonoservice_enroll_new_user();
revoke all on function public.autonoservice_enroll_new_user() from public,anon,authenticated;

-- The signup form captures contact information even if the account must first
-- be confirmed by email and no browser session is available immediately.
create or replace function public.autonoservice_new_person()
returns trigger language plpgsql security definer set search_path = ''
as $
begin
  insert into public.person_profiles(user_id,first_name,last_name,phone,city)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data->>'first_name',''),80),
    left(coalesce(new.raw_user_meta_data->>'last_name',''),100),
    left(coalesce(new.raw_user_meta_data->>'phone',''),40),
    left(coalesce(new.raw_user_meta_data->>'city',''),100)
  )
  on conflict (user_id) do nothing;
  return new;
end; $;
revoke all on function public.autonoservice_new_person() from public,anon,authenticated;

-- Only the owner of a business-type account can view its private profile.
drop policy if exists organizations_read on public.organizations;
create policy organizations_read on public.organizations for select to authenticated,anon
using (
  published or (
    owner_id=(select auth.uid())
    and exists(select 1 from public.account_types a
               where a.user_id=(select auth.uid()) and a.account_type='business')
  )
);
drop policy if exists services_read on public.organization_services;
create policy services_read on public.organization_services for select to authenticated,anon
using (exists (
  select 1 from public.organizations o
  where o.id=organization_id and (o.published or (
    o.owner_id=(select auth.uid()) and exists(
      select 1 from public.account_types a
      where a.user_id=(select auth.uid()) and a.account_type='business'
    )
  ))
));

-- Restrict private business operations to business-type accounts.
drop policy if exists organizations_insert on public.organizations;
create policy organizations_insert on public.organizations
for insert to authenticated
with check (
  owner_id=(select auth.uid())
  and exists(select 1 from public.account_types a
             where a.user_id=(select auth.uid()) and a.account_type='business')
);
drop policy if exists organizations_update on public.organizations;
create policy organizations_update on public.organizations
for update to authenticated
using (
  owner_id=(select auth.uid()) and exists (
    select 1 from public.account_types a
    where a.user_id=(select auth.uid()) and a.account_type='business')
)
with check (
  owner_id=(select auth.uid()) and exists (
    select 1 from public.account_types a
    where a.user_id=(select auth.uid()) and a.account_type='business')
);

drop policy if exists services_insert on public.organization_services;
create policy services_insert on public.organization_services
for insert to authenticated
with check (exists (
  select 1 from public.organizations o join public.account_types a on a.user_id=o.owner_id
  where o.id=organization_id and o.owner_id=(select auth.uid()) and a.account_type='business'
));
drop policy if exists services_update on public.organization_services;
create policy services_update on public.organization_services
for update to authenticated
using (exists (
  select 1 from public.organizations o join public.account_types a on a.user_id=o.owner_id
  where o.id=organization_id and o.owner_id=(select auth.uid()) and a.account_type='business'
))
with check (exists (
  select 1 from public.organizations o join public.account_types a on a.user_id=o.owner_id
  where o.id=organization_id and o.owner_id=(select auth.uid()) and a.account_type='business'
));

drop policy if exists requests_insert on public.service_requests;
create policy requests_insert on public.service_requests
for insert to authenticated
with check (
  customer_id=(select auth.uid()) and exists (
    select 1 from public.account_types a where a.user_id=(select auth.uid()) and a.account_type='customer')
);
drop policy if exists requests_read on public.service_requests;
create policy requests_read on public.service_requests
for select to authenticated
using (
  (
    customer_id=(select auth.uid())
    and exists (select 1 from public.account_types a
                where a.user_id=(select auth.uid()) and a.account_type='customer')
  ) or exists (
    select 1 from public.organizations o
    join public.account_types a on a.user_id=o.owner_id
    where o.id=organization_id and o.owner_id=(select auth.uid()) and a.account_type='business'
  )
);
drop policy if exists requests_status_by_owner on public.service_requests;
create policy requests_status_by_owner on public.service_requests
for update to authenticated
using (exists (
  select 1 from public.organizations o
  join public.account_types a on a.user_id=o.owner_id
  where o.id=organization_id and o.owner_id=(select auth.uid()) and a.account_type='business'
))
with check (exists (
  select 1 from public.organizations o
  join public.account_types a on a.user_id=o.owner_id
  where o.id=organization_id and o.owner_id=(select auth.uid()) and a.account_type='business'
));
drop policy if exists org_customers_by_owner on public.organization_customers;
create policy org_customers_by_owner on public.organization_customers
for select to authenticated using (exists (
  select 1 from public.organizations o
  join public.account_types a on a.user_id=o.owner_id
  where o.id=organization_id and o.owner_id=(select auth.uid()) and a.account_type='business'
));

-- Trigger-level verification: even if a future policy is mistakenly broadened,
-- a business account must not be allowed to issue a customer request.
create or replace function public.autonoservice_normalize_request()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  p record;
  verified_email text;
begin
  new.customer_id := auth.uid();
  new.status := 'new';
  if new.customer_id is null then raise exception 'Not signed in'; end if;
  if not exists (select 1 from public.account_types a
                 where a.user_id=new.customer_id and a.account_type='customer')
    then raise exception 'A Cliente account is required'; end if;
  if not exists (
    select 1 from public.organizations o
    join public.organization_services s on s.organization_id=o.id
    where o.id=new.organization_id and s.id=new.service_id and o.published and s.active
  ) then raise exception 'Service is not available'; end if;
  select first_name,last_name,phone,city into p
  from public.person_profiles where user_id=new.customer_id;
  select email into verified_email from auth.users where id=new.customer_id;
  if p is null then raise exception 'Complete your profile before requesting a service'; end if;
  if btrim(coalesce(p.first_name,''))='' then raise exception 'First name required'; end if;
  new.customer_name := left(btrim(concat_ws(' ',p.first_name,p.last_name)),200);
  new.customer_email := left(coalesce(verified_email,''),320);
  new.customer_phone := left(coalesce(p.phone,''),40);
  new.customer_city := left(coalesce(p.city,''),100);
  return new;
end; $$;
revoke all on function public.autonoservice_normalize_request() from public,anon,authenticated;
