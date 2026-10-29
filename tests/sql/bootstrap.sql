-- Minimal Supabase-compatible schemas for PostgreSQL policy tests.
-- These stubs do not implement GoTrue, PostgREST, Storage HTTP or signed URLs.
create role anon nologin nosuperuser nobypassrls;
create role authenticated nologin nosuperuser nobypassrls;
create schema auth;
create schema storage;
grant usage on schema public,auth,storage to anon,authenticated;

create table auth.users(
  id uuid primary key,
  email text not null,
  raw_user_meta_data jsonb not null default '{}'::jsonb
);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid;
$$;
create table storage.buckets(
  id text primary key,
  name text not null,
  public boolean not null default false,
  file_size_limit bigint,
  allowed_mime_types text[]
);
create table storage.objects(
  id uuid primary key default gen_random_uuid(),
  bucket_id text not null references storage.buckets(id),
  name text not null,
  owner_id text,
  metadata jsonb not null default '{}'::jsonb,
  unique(bucket_id,name)
);
alter table storage.objects enable row level security;
grant select on storage.objects to anon;
grant select,insert,delete on storage.objects to authenticated;

create schema test;
grant usage on schema test to anon,authenticated;
create function test.assert_true(condition boolean,description text)
returns text language plpgsql as $$
begin
  if condition is distinct from true then raise exception 'FAILED: %',description; end if;
  return 'ok - '||description;
end;
$$;
create function test.expect_denied(statement text,description text)
returns text language plpgsql as $$
begin
  begin
    execute statement;
  exception when insufficient_privilege then
    return 'ok - '||description;
  end;
  raise exception 'FAILED: expected permission denied: %',description;
end;
$$;
