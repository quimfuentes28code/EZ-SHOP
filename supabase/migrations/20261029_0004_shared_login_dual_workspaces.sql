-- AutonoService Hito 1D: one verified login may enable both Empresa and Cliente.
-- Preserve all existing users, organizations and service requests. This changes
-- authorization memberships, not ownership of any business or customer record.

-- Each user can have AT MOST one membership of each type. Previously the primary
-- key was just (user_id), artificially preventing a second workspace.
alter table public.account_types drop constraint account_types_pkey;
alter table public.account_types add constraint account_types_pkey primary key (user_id, account_type);

-- Signup still initializes the chosen role. No authorization decision depends
-- on editable raw_user_meta_data after account creation.
create or replace function public.autonoservice_enroll_new_user()
returns trigger language plpgsql security definer set search_path=''
as $$
declare
  desired text;
begin
  desired := new.raw_user_meta_data->>'account_type';
  if desired in ('business','customer') then
    insert into public.account_types(user_id,account_type)
    values (new.id,desired) on conflict (user_id,account_type) do nothing;
  end if;
  return new;
end; $$;

-- The original row policies and GRANTs already enforce user_id=auth.uid()
-- for SELECT and INSERT, with no UPDATE or DELETE granted.
-- Policies elsewhere use EXISTS with account_type; therefore they work for
-- one or both memberships without weakening isolation between organizations.
revoke all on function public.autonoservice_enroll_new_user() from public,anon,authenticated;
