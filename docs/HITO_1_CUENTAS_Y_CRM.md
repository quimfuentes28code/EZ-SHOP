# Hito 1A — Cuentas reales, CRM y solicitudes

**Estado de desarrollo:** código añadido en rama `feature/real-accounts-crm-v1`. **No operativo con datos reales hasta configurar Supabase y verificar la migración SQL / políticas RLS.** La versión anterior sigue en `main`.

## Qué se ha implementado

- Registro de usuario con email/contraseña y confirmación del email mediante Supabase Auth.
- Una identidad global con perfil personal (nombre, apellidos, teléfono, ciudad) editable.
- Alta y publicación de negocios por su propietario, sector y ciudad.
- Catálogo de servicios reales por negocio.
- Directorio de negocios publicados.
- Solicitudes de servicios desde una cuenta Cliente autenticada.
- Inserción automática de la relación cliente/negocio (CRM) mediante trigger de PostgreSQL, con un registro por empresa y cliente.
- Consulta de solicitudes por Cliente y por dueño del negocio; gestión de estados por dueño.
- Separación multiempresa mediante RLS de PostgreSQL.
- UI en ruta `/real` respetando la identidad visual existente.

### No disponible todavía

Mapa geográfico, reservas con agenda/capacidad, trabajadores, pagos, facturas, presupuestos y documentos fiscales, sincronización offline, suscripciones, conexión con las pantallas heredadas del prototipo. No es una plataforma lista para producción sin auditoría y pruebas de seguridad reales.

## Activación del backend — entorno de desarrollo

1. Conecta Supabase y crea un **proyecto de desarrollo** dedicado (no lo mezcles con información fiscal o personal de clientes existentes).
2. En el panel de Supabase abre SQL Editor y aplica `supabase/migrations/20261029_0001_auth_crm_requests.sql` una sola vez.
3. En Authentication activa Email y confirmación de correo; configura el Site URL y Redirect URL de `https://<tu-dominio>/real`, además de localhost para pruebas.
4. En Cloudflare añade estas **variables públicas** al entorno de compilación (Workers Builds / Build settings), como valores del proyecto Supabase de desarrollo:
   - `NEXT_PUBLIC_SUPABASE_URL`: Project URL.
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: publishable / anon key del proyecto.
5. **NO** añadas `service_role`, `secret` o una contraseña de base de datos a Next.js, GitHub ni a variables `NEXT_PUBLIC_`.
6. Ejecuta `npm ci && npm run typecheck && npm test && npm run build`, luego despliega el frontend. Las variables `NEXT_PUBLIC_` se incrustan en el bundle durante build; exige un build nuevo después de cambiarlas.
7. Prueba con cuentas falsas de test en dos navegadores/perfiles separados y dos negocios distintos.

### Pruebas funcionales y de seguridad obligatorias

- Cliente A crea cuenta, completa datos, selecciona servicio en empresa X y envía solicitud.
- Dueño X la ve, la ficha CRM se crea sin duplicados, cambia estado; el Cliente A ve el nuevo estado.
- Dueño Y **no** puede leer solicitudes, contactos ni cambiar estados del negocio X, ni alterando manualmente IDs en peticiones HTTP.
- Cliente B no puede leer solicitudes del cliente A.
- Nadie puede registrar una solicitud para un servicio desactivado o un negocio privado.
- No se puede enviar un `customer_id` arbitrario: trigger resuelve `auth.uid()`; ni cambiar la instantánea `customer_name/email/phone` desde el navegador.
- Un usuario sin sesión no puede crear negocios ni solicitudes, ni leer perfiles personales.
- Empleado sin privilegio no tiene acceso a CRM: permisos por roles se implementarán en fase posterior.
- Comprobar autenticación con email no confirmado, contraseña incorrecta, sesión expirada y revocación.
- Inspeccionar políticas con Supabase Advisors; revisar logs, HTTPS, límites de tasa, recuperación de cuenta, RGPD y borrado/exportación antes de incorporar datos reales.
- Si hay datos previos, aplicar migraciones tras copia de seguridad, no ejecutar SQL destructivo en producción.

## Alcance y criterios para fusionar

Para no sustituir accidentalmente la versión publicada, conservar `main` intacta hasta pasar las comprobaciones automáticas. La página de inicio enlaza a `/real`, que muestra un estado explicativo si no hay backend; así no finge autenticación ni operaciones reales.

La migración SQL y la conexión de Supabase tienen que validarse con el proyecto real: las pruebas de compilación no demuestran que el backend esté operativo. **No publicar datos reales ni crear clientes finales hasta verificar RLS desde dos cuentas distintas.**

## Siguientes fases (en orden)

1. **Hito 1B:** completar autenticación, recuperación de contraseñas, perfil en la experiencia Cliente principal, membresías/roles de empleados, migración de pantallas demo hacia datos del backend.
2. **Hito 2:** agenda real con disponibilidad por negocio/servicio y reserva transaccional evitando solapes.
3. **Hito 3:** mapa interactivo, geolocalización voluntaria, fichas públicas verificadas.
4. **Hito 4:** presupuestos, cobros manuales, conexión a proveedor de pagos; nunca guardar datos de tarjetas.
5. **Hito 5:** facturación conforme a requisitos fiscales españoles y auditoría de producción.

El diseño aprobado se mantiene sin cambios. No mezclar modalidades de pago único y servicios recurrentes hasta definir licencias y costes operativos.
