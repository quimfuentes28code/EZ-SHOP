-- Private chat attachments and per-context unread message cursors.
-- Do not place private customer files in the public company-media bucket.
alter table public.conversation_messages
 add column if not exists attachment_path text not null default '',
 add column if not exists attachment_name text not null default '' check(length(attachment_name)<=120),
 add column if not exists attachment_mime text not null default '' check(length(attachment_mime)<=100),
 add column if not exists attachment_size integer check(attachment_size>0 and attachment_size<=10485760);

alter table public.conversation_messages drop constraint if exists conversation_messages_body_check;
alter table public.conversation_messages add constraint message_text_or_file check(
 (length(btrim(body)) between 1 and 2000)
 or (length(btrim(body))=0 and attachment_path<>'')
);
alter table public.conversation_messages add constraint attachment_thread_prefix check(
 attachment_path='' or attachment_path like conversation_id::text || '/%'
);
alter table public.conversation_messages add constraint attachment_metadata_valid check(
 (attachment_path='' and attachment_name='' and attachment_mime='' and attachment_size is null)
 or (attachment_path<>'' and attachment_name<>'' and attachment_mime<>'' and attachment_size is not null)
);
create table if not exists public.conversation_read_states(
 conversation_id uuid not null references public.conversations(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 actor_role text not null check(actor_role in ('customer','business')),
 read_at timestamptz not null default now(),
 primary key(conversation_id,user_id,actor_role)
);
alter table public.conversation_read_states enable row level security;
revoke all on public.conversation_read_states from anon,authenticated;
grant select,insert,update(read_at) on public.conversation_read_states to authenticated;

create policy read_state_self_select on public.conversation_read_states for select to authenticated
using(
  user_id=(select auth.uid())
  and exists(select 1 from public.conversations c
     where c.id=conversation_id and (
       (actor_role='customer' and c.customer_id=(select auth.uid()) and
        exists(select 1 from public.account_types a where a.user_id=(select auth.uid()) and a.account_type='customer'))
       or (actor_role='business' and exists(select 1 from public.organizations o
         join public.account_types a on a.user_id=o.owner_id and a.account_type='business'
         where o.id=c.organization_id and o.owner_id=(select auth.uid())))
     ))
);
create policy read_state_self_insert on public.conversation_read_states for insert to authenticated
with check(
  user_id=(select auth.uid())
  and exists(select 1 from public.conversations c
     where c.id=conversation_id and (
       (actor_role='customer' and c.customer_id=(select auth.uid()) and
        exists(select 1 from public.account_types a where a.user_id=(select auth.uid()) and a.account_type='customer'))
       or (actor_role='business' and exists(select 1 from public.organizations o
         join public.account_types a on a.user_id=o.owner_id and a.account_type='business'
         where o.id=c.organization_id and o.owner_id=(select auth.uid())))
     ))
);
create policy read_state_self_update on public.conversation_read_states for update to authenticated
using(user_id=(select auth.uid()))
with check(user_id=(select auth.uid()) and exists(select 1 from public.conversations c
 where c.id=conversation_id and (
   (actor_role='customer' and c.customer_id=(select auth.uid()) and
    exists(select 1 from public.account_types a where a.user_id=(select auth.uid()) and a.account_type='customer'))
   or (actor_role='business' and exists(select 1 from public.organizations o
    join public.account_types a on a.user_id=o.owner_id and a.account_type='business'
    where o.id=c.organization_id and o.owner_id=(select auth.uid())))
 )));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('autonoservice-private-chat','autonoservice-private-chat',false,10485760,
array['image/jpeg','image/png','image/webp','application/pdf','text/plain'])
on conflict(id) do nothing;
-- If a file path does not start with a valid conversation UUID it cannot
-- pass. A client can only access file paths belonging to their own threads.
create policy autonoservice_private_chat_insert on storage.objects for insert to authenticated
with check(
 bucket_id='autonoservice-private-chat'
 and exists(select 1 from public.conversations c
   where c.id=(case when split_part(name,'/',1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then split_part(name,'/',1)::uuid end)
   and ((c.customer_id=(select auth.uid()) and exists(select 1 from public.account_types a
        where a.user_id=(select auth.uid()) and a.account_type='customer'))
    or exists(select 1 from public.organizations o join public.account_types a
         on a.user_id=o.owner_id and a.account_type='business'
         where o.id=c.organization_id and o.owner_id=(select auth.uid()))))
);
create policy autonoservice_private_chat_read on storage.objects for select to authenticated
using(
 bucket_id='autonoservice-private-chat'
 and exists(select 1 from public.conversations c
   where c.id=(case when split_part(name,'/',1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then split_part(name,'/',1)::uuid end)
   and ((c.customer_id=(select auth.uid()) and exists(select 1 from public.account_types a
        where a.user_id=(select auth.uid()) and a.account_type='customer'))
    or exists(select 1 from public.organizations o join public.account_types a
        on a.user_id=o.owner_id and a.account_type='business'
        where o.id=c.organization_id and o.owner_id=(select auth.uid()))))
);
create policy autonoservice_private_chat_delete_own on storage.objects for delete to authenticated
using(
 bucket_id='autonoservice-private-chat'
 and owner_id=(select auth.uid())::text
);
