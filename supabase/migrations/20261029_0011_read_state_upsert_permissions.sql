-- PostgREST upsert updates every supplied column on conflict (including the
-- composite key). RLS already restricts every UPDATE to the current account
-- and a conversation in which that account has the requested context.
grant update on public.conversation_read_states to authenticated;
