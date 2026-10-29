# AutonoService: una identidad y dos espacios (decisión vigente)

## Experiencia

- Una persona registra su correo electrónico **una única vez** en Supabase Auth.
- El mismo correo y contraseña permiten acceder tanto al espacio **Empresa** como a **Cliente**.
- Siguen existiendo dos botones en la portada y dos interfaces con funcionalidades específicas.
- Desde **Empresa** se gestionan negocios propios, servicios, contactos CRM y solicitudes recibidas.
- Desde **Cliente** se exploran empresas, se envían solicitudes y se consultan encargos personales.
- Activar el segundo espacio no crea otro usuario, no envía otro correo de verificación y **no elimina negocios ni contactos**.
- Si se pulsa «Crear cuenta» con un correo existente, es preferible pulsar **Acceder** con la contraseña habitual y activar el segundo espacio tras identificarse. No se intenta duplicar el usuario.
- AutonoSuite es una mejora futura del espacio Empresa, no un nuevo login.

## Arquitectura de autenticación y permisos

- Tabla de Supabase Auth `auth.users`: una fila por identidad verificada / correo.
- `public.account_types` representa las habilitaciones del usuario mediante clave primaria compuesta `(user_id, account_type)`. Puede haber **una fila Empresa** y **una fila Cliente** para la misma identidad.
- `public.person_profiles`: perfil personal básico de la identidad, compartido por los dos espacios.
- `public.organizations`: datos comerciales separados, asociados al propietario; cada organización mantiene clientes y solicitudes propios.
- `public.organization_customers`: CRM privado por organización.
- `public.service_requests`: solicitud con su cliente y su negocio. Las empresas solo ven solicitudes de sus negocios; los clientes ven únicamente las propias.
- Las políticas RLS siguen verificando `auth.uid()` y el rol habilitado. La interfaz elegida NO sustituye la autorización en PostgreSQL.
- La metadata editable del usuario puede iniciar su primera habilitación al registrarse, pero no se consulta en las políticas.

## Migración incremental

Aplicar `supabase/migrations/20261029_0004_shared_login_dual_workspaces.sql` **después** de 0001, 0002 y 0003. Conserva las habilitaciones anteriores, negocios y solicitudes. Cambia la restricción de PK y el trigger de alta a conflicto de clave compuesta.

## Pruebas obligatorias

1. Usuario ya existente de Empresa inicia sesión en el registro Cliente utilizando su mismo correo.
2. Ve una invitación «Activar Cliente con esta cuenta».
3. Activa Cliente y accede a `/cliente`.
4. Vuelve a `/empresa` con la misma sesión y confirma que conserva sus negocios.
5. Cliente envía solicitud; empresa propietaria puede verla en CRM; ninguna otra empresa puede.
6. Crear una cuenta totalmente nueva desde Cliente o Empresa asigna correctamente su primer espacio.
7. Reintentar la activación de un espacio no crea duplicados.
8. Sin iniciar sesión no se permite crear datos; otras identidades no pueden activar roles en otra cuenta.
9. El correo nunca se solicita de nuevo para confirmar la segunda habilitación, porque la identidad ya está verificada.

**No** indica que los datos de Empresa y Cliente estén completamente separados en autenticación: comparten identidad y perfil personal; solamente sus operaciones y permisos de aplicación son contextuales. En el futuro podrá añadirse configuración de contacto diferente para cada espacio.

## Estado

Esta implementación permite usar ambos espacios con un mismo correo. El selector **Mi negocio / Modo cliente** cambia la ruta y conserva la sesión; la preferencia del navegador no concede acceso ni se confunde con la clave demo. Si falta una habilitación, la pantalla existente permite activarla.

El código actual incluye mapa de sedes publicadas, publicaciones y mensajes con adjuntos. Facturación fiscal, pagos, reservas automáticas y permisos delegados siguen pendientes. La revisión de integración se describe en [PULIDO_20261029.md](PULIDO_20261029.md); su SQL correctivo no se aplica automáticamente al backend.
