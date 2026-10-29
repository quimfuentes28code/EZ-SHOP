-- AutonoService: first real multi-tenant slice (Supabase/PostgreSQL).
-- Run in Supabase SQL Editor as project owner, ONCE on an empty project.
-- Never put a service_role key in browser code.

create extension if not exists pgcrypto;

create table if not exists public.person_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  phone text not null default '',
  city text not null default '',
  updated_at timestamptz not null default now(),
  constraint person_first_name_len check (char_length(first_name)<=80),
  constraint person_last_name_len check (char_length(last_name)<=100),
  constraint person_phone_len check (char_length(phone)<=40),
  constraint person_city_len check (char_length(city)<=100)
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null check (length(btrim(name)) between 2 and 120),
  category text not null default 'Otros' check (length(category)<=80),
  city text not null default '' check (length(city)<=100),
  description text not null default '' check (length(description)<=1200),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  unique(id, owner_id)
);

create table if not exists public.organization_services (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null check (length(btrim(title)) between 2 and 120),
  description text not null default '' check (length(description)<=1200),
  price_eur numeric(10,2) check (price_eur between 0 and 1000000),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(id, organization_id)
);

create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  service_id uuid not null,
  customer_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  customer_name text not null default '',
  customer_email text not null default '',
  customer_phone text not null default '',
  notes text not null default '' check (length(notes)<=2000),
  requested_date date,
  status text not null default 'new' check (status in ('new','accepted','rejected','completed')),
  created_at timestamptz not null default now(),
  constraint service_matches_organization foreign key (service_id, organization_id)
    references public.organization_services(id, organization_id)
);

create table if not exists public.organization_customers (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  email text not null,
  phone text not null default '',
  first_contact_at timestamptz not null default now(),
  last_contact_at timestamptz not null default now(),
  primary key(organization_id, customer_id)
);

create or replace function public.autonoservice_new_person()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.person_profiles(user_id,first_name,last_name)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data->>'first_name',''),80),
    left(coalesce(new.raw_user_meta_data->>'last_name',''),100)
  )
  on conflict (user_id) do nothing;
  return new;
end; $$;

drop trigger if exists autonoservice_auth_user_created on auth.users;
create trigger autonoservice_auth_user_created
after insert on auth.users for each row execute function public.autonoservice_new_person();

-- Backfill pre-existing accounts only when this migration is first introduced.
insert into public.person_profiles(user_id)
select id from auth.users on conflict do nothing;

create or replace function public.autonoservice_normalize_request()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  p record;
  verified_email text;
begin
  -- Status and identity are never trusted from browser input.
  new.customer_id := auth.uid();
  new.status := 'new';
  if new.customer_id is null then raise exception 'Not signed in'; end if;
  if not exists (
    select 1 from public.organizations o
    join public.organization_services s on s.organization_id=o.id
    where o.id=new.organization_id and s.id=new.service_id and o.published and s.active
  ) then raise exception 'Service is not available'; end if;
  select first_name, last_name, phone into p from public.person_profiles where user_id=new.customer_id;
  select email into verified_email from auth.users where id=new.customer_id;
  if p is null then raise exception 'Complete your profile before requesting a service'; end if;
  if btrim(coalesce(p.first_name,''))='' then raise exception 'First name required'; end if;
  new.customer_name := left(btrim(concat_ws(' ',p.first_name,p.last_name)),200);
  new.customer_email := left(coalesce(verified_email,''),320);
  new.customer_phone := left(coalesce(p.phone,''),40);
  return new;
end; $$;

drop trigger if exists autonoservice_before_request on public.service_requests;
create trigger autonoservice_before_request before insert on public.service_requests
for each row execute function public.autonoservice_normalize_request();

create or replace function public.autonoservice_create_customer_relationship()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.organization_customers
    (organization_id,customer_id,display_name,email,phone)
  values
    (new.organization_id,new.customer_id,new.customer_name,new.customer_email,new.customer_phone)
  on conflict (organization_id,customer_id) do update set
    display_name=excluded.display_name,
    email=excluded.email,
    phone=excluded.phone,
    last_contact_at=now();
  return new;
end; $$;

drop trigger if exists autonoservice_after_request on public.service_requests;
create trigger autonoservice_after_request after insert on public.service_requests
for each row execute function public.autonoservice_create_customer_relationship();

alter table public.person_profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_services enable row level security;
alter table public.service_requests enable row level security;
alter table public.organization_customers enable row level security;

create policy person_read_own on public.person_profiles for select to authenticated
using (user_id=(select auth.uid()));
create policy person_update_own on public.person_profiles for update to authenticated
using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));

create policy organizations_read on public.organizations for select to authenticated,anon
using (published or owner_id=(select auth.uid()));
create policy organizations_insert on public.organizations for insert to authenticated
with check (owner_id=(select auth.uid()));
create policy organizations_update on public.organizations for update to authenticated
using (owner_id=(select auth.uid())) with check (owner_id=(select auth.uid()));

create policy services_read on public.organization_services for select to authenticated,anon
using (exists (select 1 from public.organizations o where o.id=organization_id and (o.published or o.owner_id=(select auth.uid()))));
create policy services_insert on public.organization_services for insert to authenticated
with check (exists (select 1 from public.organizations o where o.id=organization_id and o.owner_id=(select auth.uid())));
create policy services_update on public.organization_services for update to authenticated
using (exists (select 1 from public.organizations o where o.id=organization_id and o.owner_id=(select auth.uid())))
with check (exists (select 1 from public.organizations o where o.id=organization_id and o.owner_id=(select auth.uid())));

create policy requests_read on public.service_requests for select to authenticated
using (customer_id=(select auth.uid()) or exists
  (select 1 from public.organizations o where o.id=organization_id and o.owner_id=(select auth.uid())));
create policy requests_insert on public.service_requests for insert to authenticated
with check (customer_id=(select auth.uid()));
create policy requests_status_by_owner on public.service_requests for update to authenticated
using (exists (select 1 from public.organizations o where o.id=organization_id and o.owner_id=(select auth.uid())))
with check (exists (select 1 from public.organizations o where o.id=organization_id and o.owner_id=(select auth.uid())));

create policy org_customers_by_owner on public.organization_customers for select to authenticated
using (exists (select 1 from public.organizations o where o.id=organization_id and o.owner_id=(select auth.uid())));

-- Limit API privileges beyond RLS; browser cannot modify identity snapshots.
revoke all on public.person_profiles, public.organizations, public.organization_services,
  public.service_requests, public.organization_customers from anon, authenticated;
grant select,update(first_name,last_name,phone,city) on public.person_profiles to authenticated;
grant select on public.organizations, public.organization_services to anon;
grant select,insert,update(name,category,city,description,published) on public.organizations to authenticated;
grant select,insert,update(title,description,price_eur,active) on public.organization_services to authenticated;
grant select,insert,update(status) on public.service_requests to authenticated;
grant select on public.organization_customers to authenticated;

-- Block direct invocations; trigger execution remains available.
revoke all on function public.autonoservice_new_person() from public,anon,authenticated;
revoke all on function public.autonoservice_normalize_request() from public,anon,authenticated;
revoke all on function public.autonoservice_create_customer_relationship() from public,anon,authenticated;
