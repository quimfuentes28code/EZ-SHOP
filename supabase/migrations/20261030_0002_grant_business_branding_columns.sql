-- The social editor was added in migration 0008 but new organization
-- columns never received UPDATE grants. RLS already limits writes to the
-- authenticated owner and remains in force.
grant update(tagline,accent_color,avatar_url,cover_url)
on public.organizations to authenticated;
