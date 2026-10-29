-- Business productivity tools: private internal work items + module preferences.
create table if not exists public.business_work_items(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 kind text not null check(kind in ('project','appointment','quote','work_order','order')),
 title text not null check(length(btrim(title)) between 2 and 160),
 details text not null default '' check(length(details)<=4000),
 status text not null default 'pending' check(status in ('pending','in_progress','done','cancelled')),
 scheduled_date date,
 amount_eur numeric(12,2) check(amount_eur>=0 and amount_eur<=10000000),
 created_at timestamptz not null default now()
);
create index if not exists business_work_items_by_org on public.business_work_items(organization_id,kind,created_at desc);
alter table public.business_work_items enable row level security;
revoke all on public.business_work_items from anon,authenticated;
grant select,insert,update,delete on public.business_work_items to authenticated;
create policy work_items_owner_read on public.business_work_items for select to authenticated
using(exists(select 1 from public.organizations o join public.account_types a
 on a.user_id=o.owner_id and a.account_type='business'
 where o.id=organization_id and o.owner_id=(select auth.uid())));
create policy work_items_owner_insert on public.business_work_items for insert to authenticated
with check(exists(select 1 from public.organizations o join public.account_types a
 on a.user_id=o.owner_id and a.account_type='business'
 where o.id=organization_id and o.owner_id=(select auth.uid())));
create policy work_items_owner_update on public.business_work_items for update to authenticated
using(exists(select 1 from public.organizations o join public.account_types a
 on a.user_id=o.owner_id and a.account_type='business'
 where o.id=organization_id and o.owner_id=(select auth.uid())))
with check(exists(select 1 from public.organizations o join public.account_types a
 on a.user_id=o.owner_id and a.account_type='business'
 where o.id=organization_id and o.owner_id=(select auth.uid())));
create policy work_items_owner_delete on public.business_work_items for delete to authenticated
using(exists(select 1 from public.organizations o join public.account_types a
 on a.user_id=o.owner_id and a.account_type='business'
 where o.id=organization_id and o.owner_id=(select auth.uid())));

create table if not exists public.organization_module_settings(
 organization_id uuid primary key references public.organizations(id) on delete cascade,
 modules text[] not null default array[]::text[],
 updated_at timestamptz not null default now()
);
alter table public.organization_module_settings enable row level security;
revoke all on public.organization_module_settings from anon,authenticated;
grant select,insert,update on public.organization_module_settings to authenticated;
create policy module_preferences_own_read on public.organization_module_settings for select to authenticated
using(exists(select 1 from public.organizations o join public.account_types a
 on a.user_id=o.owner_id and a.account_type='business'
 where o.id=organization_id and o.owner_id=(select auth.uid())));
create policy module_preferences_own_insert on public.organization_module_settings for insert to authenticated
with check(exists(select 1 from public.organizations o join public.account_types a
 on a.user_id=o.owner_id and a.account_type='business'
 where o.id=organization_id and o.owner_id=(select auth.uid())));
create policy module_preferences_own_update on public.organization_module_settings for update to authenticated
using(exists(select 1 from public.organizations o join public.account_types a
 on a.user_id=o.owner_id and a.account_type='business'
 where o.id=organization_id and o.owner_id=(select auth.uid())))
with check(exists(select 1 from public.organizations o join public.account_types a
 on a.user_id=o.owner_id and a.account_type='business'
 where o.id=organization_id and o.owner_id=(select auth.uid())));
