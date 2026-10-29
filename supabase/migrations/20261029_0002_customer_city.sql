-- Hito 1A: attach the client's optional city to the authorized customer relationship.
-- Forward-only migration: do not edit the already-applied base migration.
alter table public.service_requests add column if not exists customer_city text not null default '';
alter table public.organization_customers add column if not exists city text not null default '';

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
  if not exists (
    select 1 from public.organizations o
    join public.organization_services s on s.organization_id=o.id
    where o.id=new.organization_id and s.id=new.service_id and o.published and s.active
  ) then raise exception 'Service is not available'; end if;
  select first_name,last_name,phone,city into p from public.person_profiles where user_id=new.customer_id;
  select email into verified_email from auth.users where id=new.customer_id;
  if p is null then raise exception 'Complete your profile before requesting a service'; end if;
  if btrim(coalesce(p.first_name,''))='' then raise exception 'First name required'; end if;
  new.customer_name := left(btrim(concat_ws(' ',p.first_name,p.last_name)),200);
  new.customer_email := left(coalesce(verified_email,''),320);
  new.customer_phone := left(coalesce(p.phone,''),40);
  new.customer_city := left(coalesce(p.city,''),100);
  return new;
end; $$;

create or replace function public.autonoservice_create_customer_relationship()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.organization_customers
    (organization_id,customer_id,display_name,email,phone,city)
  values
    (new.organization_id,new.customer_id,new.customer_name,new.customer_email,new.customer_phone,new.customer_city)
  on conflict (organization_id,customer_id) do update set
    display_name=excluded.display_name,
    email=excluded.email,
    phone=excluded.phone,
    city=excluded.city,
    last_contact_at=now();
  return new;
end; $$;

revoke all on function public.autonoservice_normalize_request() from public,anon,authenticated;
revoke all on function public.autonoservice_create_customer_relationship() from public,anon,authenticated;
