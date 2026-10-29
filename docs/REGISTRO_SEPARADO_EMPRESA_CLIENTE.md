# Registro independiente para Empresa y Cliente (29 octubre 2026)

**Actualización posterior: este diseño de correos separados ha sido sustituido por espacios Empresa y Cliente bajo una sola identidad.** Consulta [CUENTA_UNICA_DOS_ESPACIOS.md](CUENTA_UNICA_DOS_ESPACIOS.md) para la decisión vigente y la migración 0004.


## Decisión histórica sustituida

La decisión histórica proponía que los botones de la portada creasen cuentas independientes. Fue sustituida: hoy ambos espacios se activan sobre una identidad global y no hay que registrar dos correos. El resto del documento se conserva para entender aquella migración.

- **Empresa**: `/registro/empresa`. Correo y contraseña para actividad profesional. Tras registrarse, crea su negocio, publica servicios y gestiona solicitudes/CRM.
- **Cliente**: `/registro/cliente`. Correo y contraseña para uso personal. Tras registrarse, completa sus datos, explora negocios y puede solicitar servicios.
- **Cuentas separadas**: cada cuenta posee un UID y una dirección de correo propios. La misma dirección no puede registrar a la vez una cuenta Empresa y otra Cliente. Si una persona quiere ambos espacios, necesita dos cuentas con correos distintos.
- **AutonoSuite** es una actualización futura de una cuenta Empresa, nunca un tercer tipo de cuenta ni una segunda aplicación.
- Se conservan pantallas de demostración para revisión, pero no son los flujos de registro de los botones principales.
- `/real` permanece como selector de tipo de cuenta por compatibilidad con enlaces antiguos.

## Seguridad de la separación

La tabla `public.account_types` almacena un único tipo inmutable por `auth.users.id`: `business` o `customer`.

- El registro incluye `account_type` en metadata **solo para la inscripción inicial**. La autorización posterior depende de la fila inmutable en PostgreSQL y de las políticas RLS, **no de la metadata editable del usuario**.
- La cuenta Empresa puede gestionar negocios, servicios, solicitudes y contactos de su propio negocio, pero no enviar solicitudes como Cliente.
- La cuenta Cliente puede enviar solicitudes y consultar sus propias operaciones, pero no dar de alta negocios ni leer contactos CRM de otros.
- La tabla permite un único `INSERT` al dueño para adaptar **cuentas previas al cambio** que no tienen tipo asignado. No admite `UPDATE` ni `DELETE` desde la aplicación. La elección es irreversible desde el navegador.
- La sesión persistida de un tipo no se utiliza para acceder al otro: la interfaz indica la incompatibilidad y permite cerrar sesión.
- Para pruebas con dos cuentas, utiliza perfiles de navegador diferentes o una ventana de incógnito.

## Migración histórica (continuar con 0004 y las posteriores para el modelo vigente)

Aplicar una sola vez `supabase/migrations/20261029_0003_separate_account_types.sql` sobre el proyecto de desarrollo, después de las migraciones 0001 y 0002.

Hay una cuenta anterior a esta separación: se conserva sin asignarle tipo arbitrariamente. En su siguiente acceso el usuario elige de forma explícita Empresa o Cliente, una única vez.

## Antes de producción

Verificar con dos cuentas autenticadas (de emails distintos):
1. Empresa se registra por el botón izquierdo y crea/publica servicio.
2. Cliente se registra por el botón derecho, completa datos y envía solicitud.
3. Empresa recibe solicitud y ficha CRM de ese Cliente; Cliente observa cambio de estado.
4. Cliente no puede crear negocios; Empresa no puede pedir servicios desde una identidad profesional.
5. Cambiar `user_metadata.account_type` no altera la autorización.
6. Un correo Empresa en el login Cliente recibe rechazo sin acceso al workspace.
7. No se pueden consultar solicitudes o CRM de otros negocios.
8. Probar verificación de correo con SMTP habilitado y perfiles de prueba; revisar políticas, tasas y sesiones.

El diseño de marca no cambia. El mapa real, cobros y facturación continúan en el roadmap.
