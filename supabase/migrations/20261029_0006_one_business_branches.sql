-- AutonoService Hito: one business per new Empresa account; multiple branches per business.
-- Existing organizations are grandfathered: DO NOT merge, delete or hide them.

create table if not exists public.organization_locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 2 and 120),
  city text not null default '' check (char_length(city)<=100),
  address text not null default '' check (char_length(address)<=250),
  service_mode text not null default 'local'
    check(service_mode in ('local','domicilio','online','mixto')),
  availability_mode text not null default 'cita'
    check(availability_mode in ('horario','cita','24h','flexible')),
  opens_at time without time zone,
  closes_at time without time zone,
  weekdays text[] not null default array[]::text[],
  published boolean not null default false,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  constraint branch_hours_valid check (
    availability_mode <> 'horario'
    or (opens_at is not null and closes_at is not null
        and opens_at<>closes_at and cardinality(weekdays)>0)
  ),
  constraint branch_weekdays_valid check(weekdays <@ array['lun','mar','mie','jue','vie','sab','dom']::text[])
);
create index if not exists organization_locations_by_org
 on public.organization_locations(organization_id,created_at);
create unique index if not exists only_one_primary_location_per_org
 on public.organization_locations(organization_id) where is_primary;

-- Seed one private primary location for every existing business.
insert into public.organization_locations(organization_id,name,city,is_primary,published)
select o.id,'Sede principal',o.city,true,false
from public.organizations o
where not exists (select 1 from public.organization_locations l where l.organization_id=o.id);

-- Prevent a second business being created in the same account. The advisory
-- transaction lock serializes attempts from different browser tabs.
create or replace function public.autonoservice_one_business_per_owner()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  if new.owner_id is null then raise exception 'Business owner required'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.owner_id::text,47));
  if exists(select 1 from public.organizations o where o.owner_id=new.owner_id) then
    raise exception 'Esta cuenta ya tiene una empresa. Para otra dirección, añade una sede en Mi empresa.';
  end if;
  return new;
end; $$;
drop trigger if exists autonoservice_business_limit on public.organizations;
create trigger autonoservice_business_limit before insert on public.organizations
for each row execute function public.autonoservice_one_business_per_owner();

create or replace function public.autonoservice_primary_location_for_new_org()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  insert into public.organization_locations(organization_id,name,city,is_primary,published)
  values(new.id,'Sede principal',new.city,true,false);
  return new;
end; $$;
drop trigger if exists autonoservice_org_default_location on public.organizations;
create trigger autonoservice_org_default_location after insert on public.organizations
for each row execute function public.autonoservice_primary_location_for_new_org();

revoke all on function public.autonoservice_one_business_per_owner() from public,anon,authenticated;
revoke all on function public.autonoservice_primary_location_for_new_org() from public,anon,authenticated;

alter table public.organization_locations enable row level security;
revoke all on public.organization_locations from anon,authenticated;
grant select on public.organization_locations to anon,authenticated;
grant insert(organization_id,name,city,address,service_mode,availability_mode,opens_at,closes_at,weekdays,published)
 on public.organization_locations to authenticated;
grant update(name,city,address,service_mode,availability_mode,opens_at,closes_at,weekdays,published)
 on public.organization_locations to authenticated;

create policy location_public_or_owner_read
on public.organization_locations for select to anon,authenticated
using(
  (published and exists (select 1 from public.organizations o
                         where o.id=organization_id and o.published))
  or (exists (select 1 from public.organizations o
            join public.account_types a on a.user_id=o.owner_id and a.account_type='business'
            where o.id=organization_id and o.owner_id=(select auth.uid())))
);
create policy location_owner_create
on public.organization_locations for insert to authenticated
with check(
  exists (select 1 from public.organizations o
          join public.account_types a on a.user_id=o.owner_id and a.account_type='business'
          where o.id=organization_id and o.owner_id=(select auth.uid()))
);
create policy location_owner_update
on public.organization_locations for update to authenticated
using(exists (select 1 from public.organizations o
              join public.account_types a on a.user_id=o.owner_id and a.account_type='business'
              where o.id=organization_id and o.owner_id=(select auth.uid())))
with check(exists (select 1 from public.organizations o
                   join public.account_types a on a.user_id=o.owner_id and a.account_type='business'
                   where o.id=organization_id and o.owner_id=(select auth.uid())));
