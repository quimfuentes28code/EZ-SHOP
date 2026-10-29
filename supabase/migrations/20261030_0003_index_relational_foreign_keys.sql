-- Resolve 9 Supabase performance-advisor warnings for foreign keys that
-- are used for joins, cascading deletes and tenant-specific data retrieval.
-- Non-destructive: no table or row contents are modified.
create index if not exists conversation_messages_sender_idx
 on public.conversation_messages(sender_id);
create index if not exists conversation_read_states_user_idx
 on public.conversation_read_states(user_id);
create index if not exists customer_favorites_organization_idx
 on public.customer_favorites(organization_id);
create index if not exists organization_customers_customer_idx
 on public.organization_customers(customer_id);
create index if not exists organization_services_organization_idx
 on public.organization_services(organization_id);
create index if not exists organizations_owner_idx
 on public.organizations(owner_id);
create index if not exists service_requests_service_org_idx
 on public.service_requests(service_id,organization_id);
create index if not exists service_requests_customer_idx
 on public.service_requests(customer_id);
create index if not exists service_requests_organization_idx
 on public.service_requests(organization_id);
