-- Permitir borrar únicamente sedes pertenecientes a la empresa del usuario autenticado.
-- No se concede DELETE sobre organizaciones ni sobre servicios, clientes o mensajes.
-- Las políticas SELECT existentes permiten al propietario ver el registro antes de eliminarlo.
revoke delete on table public.organization_locations from anon;
grant delete on table public.organization_locations to authenticated;

drop policy if exists location_owner_delete on public.organization_locations;
create policy location_owner_delete
on public.organization_locations
for delete to authenticated
using (
  exists (
    select 1 from public.organizations o
    join public.account_types a
      on a.user_id = o.owner_id and a.account_type = 'business'
    where o.id = organization_locations.organization_id
      and o.owner_id = (select auth.uid())
  )
);
