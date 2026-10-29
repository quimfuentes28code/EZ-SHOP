-- AutonoService: real Cliente favorites and text conversations.
-- A conversation connects one Cliente identity to one company. A message's
-- actor_role distinguishes the Cliente/Empresa context when both use one login.

create table if not exists public.customer_favorites (
  customer_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(customer_id,organization_id)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  customer_display_name text not null default '',
  created_at timestamptz not null default now(),
  unique(organization_id,customer_id)
);

create table if not exists public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  actor_role text not null check (actor_role in ('customer','business')),
  body text not null check (length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);


-- The public chat request is user-initiated. Capture a display name from the
-- authenticated profile rather than trusting an arbitrary browser-supplied name.
create or replace function public.autonoservice_conversation_init()
returns trigger language plpgsql security definer set search_path=''
as $
declare
  p record;
begin
  new.customer_id := auth.uid();
  if new.customer_id is null then raise exception 'Authentication required'; end if;
  if not exists(select 1 from public.account_types a
                where a.user_id=new.customer_id and a.account_type='customer') then
     raise exception 'Cliente workspace is required';
  end if;
  if not exists(select 1 from public.organizations o where o.id=new.organization_id and o.published) then
     raise exception 'Business profile is not public';
  end if;
  select first_name,last_name into p from public.person_profiles where user_id=new.customer_id;
  new.customer_display_name := left(
    coalesce(nullif(btrim(concat_ws(' ',nullif(btrim(coalesce(p.first_name,'')),''),nullif(btrim(coalesce(p.last_name,'')),''))),''),'Cliente'),
    200
  );
  return new;
end; $;
drop trigger if exists autonoservice_conversation_before_insert on public.conversations;
create trigger autonoservice_conversation_before_insert
before insert on public.conversations for each row
execute function public.autonoservice_conversation_init();
revoke all on function public.autonoservice_conversation_init() from public,anon,authenticated;

create index if not exists conversation_messages_by_thread on public.conversation_messages(conversation_id,created_at);
create index if not exists conversations_by_customer on public.conversations(customer_id,created_at desc);
create index if not exists conversations_by_business on public.conversations(organization_id,created_at desc);

alter table public.customer_favorites enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_messages enable row level security;

revoke all on public.customer_favorites,public.conversations,public.conversation_messages from anon,authenticated;
grant select,insert,delete on public.customer_favorites to authenticated;
grant select,insert on public.conversations to authenticated;
grant select,insert on public.conversation_messages to authenticated;

-- Nobody may favorite private or non-existent company profiles.
create policy favorites_own_read on public.customer_favorites for select to authenticated
using (customer_id=(select auth.uid()) and exists(
  select 1 from public.account_types a where a.user_id=(select auth.uid()) and a.account_type='customer'
));
create policy favorites_own_add on public.customer_favorites for insert to authenticated
with check (
  customer_id=(select auth.uid())
  and exists(select 1 from public.account_types a where a.user_id=(select auth.uid()) and a.account_type='customer')
  and exists(select 1 from public.organizations o where o.id=organization_id and o.published)
);
create policy favorites_own_remove on public.customer_favorites for delete to authenticated
using (customer_id=(select auth.uid()) and exists(
  select 1 from public.account_types a where a.user_id=(select auth.uid()) and a.account_type='customer'
));

-- Existing conversations stay visible after the company is unpublished; the
-- owner/customer are authenticated participants regardless of public visibility.
create policy conversations_participant_read on public.conversations for select to authenticated
using (
  (
    customer_id=(select auth.uid())
    and exists(select 1 from public.account_types a
               where a.user_id=(select auth.uid()) and a.account_type='customer')
  )
  or exists(
    select 1 from public.organizations o
    join public.account_types a on a.user_id=o.owner_id and a.account_type='business'
    where o.id=organization_id and o.owner_id=(select auth.uid())
  )
);
create policy conversations_customer_start on public.conversations for insert to authenticated
with check (
  customer_id=(select auth.uid())
  and exists(select 1 from public.account_types a
             where a.user_id=(select auth.uid()) and a.account_type='customer')
  and exists(select 1 from public.organizations o
             where o.id=organization_id and o.published)
);

create policy messages_participant_read on public.conversation_messages for select to authenticated
using (exists (
  select 1 from public.conversations c
  where c.id=conversation_id
    and (
      (
        c.customer_id=(select auth.uid())
        and exists(select 1 from public.account_types a
                   where a.user_id=(select auth.uid()) and a.account_type='customer')
      )
      or exists (
        select 1 from public.organizations o
        join public.account_types a on a.user_id=o.owner_id and a.account_type='business'
        where o.id=c.organization_id and o.owner_id=(select auth.uid())
      )
    )
));
create policy messages_participant_send on public.conversation_messages for insert to authenticated
with check (
  sender_id=(select auth.uid())
  and exists (
    select 1 from public.conversations c where c.id=conversation_id
      and (
        (
          actor_role='customer'
          and c.customer_id=(select auth.uid())
          and exists(select 1 from public.account_types a
                     where a.user_id=(select auth.uid()) and a.account_type='customer')
        )
        or (
          actor_role='business'
          and exists (
            select 1 from public.organizations o
            join public.account_types a on a.user_id=o.owner_id and a.account_type='business'
            where o.id=c.organization_id and o.owner_id=(select auth.uid())
          )
        )
      )
  )
);

-- No UPDATE/DELETE on messages, and no DELETE on threads; these are
-- append-only until retention/export/deletion workflows are implemented.
