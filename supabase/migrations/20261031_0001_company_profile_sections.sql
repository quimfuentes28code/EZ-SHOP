-- Reorderable public profile blocks, shared across Cliente and Empresa.
-- Only presentation layout is stored; CRM and private account data are unchanged.
begin;

alter table public.organizations
  add column if not exists profile_sections jsonb not null
  default '["about","services","locations","posts","portfolio"]'::jsonb;

-- Prevent malformed client writes; future modules can add IDs via later code.
alter table public.organizations
  drop constraint if exists organizations_profile_sections_valid;
alter table public.organizations
  add constraint organizations_profile_sections_valid check (
    jsonb_typeof(profile_sections) = 'array'
    and jsonb_array_length(profile_sections) <= 20
  );

-- Existing organization RLS requires the signed-in business owner.
-- The role also needs explicit column privileges for the browser editor.
grant update(profile_sections) on public.organizations to authenticated;

commit;
