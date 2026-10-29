# Pruebas locales de migraciones y permisos

Esta suite ejecuta SQL en **PostgreSQL real**, dentro de un contenedor Docker desechable. No utiliza Supabase ni acepta una URL de base de datos. Sirve para detectar errores de sintaxis, permisos de columnas y políticas RLS antes de revisar una migración para el proyecto conectado.

## Ejecutar

Requisitos: Node.js 22 o superior, Docker con contenedores Linux y acceso al daemon local. La primera ejecución descarga `postgres:17-alpine` desde Docker Hub.

```bash
node scripts/test-sql.mjs
```

El runner fuerza el socket local, elimina selectores de contextos Docker remotos, crea su propia base `autonoservice_test` y aplica todos los archivos de `supabase/migrations/` en orden. El contenedor usa almacenamiento temporal, `--network none` y ningún puerto publicado. El SQL se envía por `docker exec`; el contenedor se elimina al terminar, también si falla una aserción.

En Windows se necesita Docker Desktop en modo de contenedores Linux; el runner utiliza el pipe local de Docker. En Linux/WSL se utiliza `/var/run/docker.sock`. No se ha comprobado esta ejecución en un equipo Windows físico durante la entrega.

## Qué comprueba

`tests/sql/bootstrap.sql` crea esquemas mínimos compatibles con las referencias SQL de Supabase: `auth.users`, `auth.uid()`, `storage.buckets` y `storage.objects`. Los actores `anon` y `authenticated` tienen `NOSUPERUSER` y `NOBYPASSRLS`. La configuración de `auth.uid()` representa la identidad de prueba; no convierte las consultas comprobadas en consultas de administrador.

Las dos suites utilizan tres personas ficticias y dos negocios:

- Actualización de logo, portada, eslogan y color sin permitir cambiar la propiedad del negocio.
- Subida con un nombre comercial normal y rechazo de carpetas de otra empresa, incluso tras cambiar el nombre comercial a un UUID.
- Acceso a medios por su propietario o por una referencia publicada autorizada; compatibilidad de referencias nuevas y URLs antiguas.
- Inaccesibilidad de archivos de borradores y archivos sin referencia para visitantes y otros propietarios.
- Publicación, retirada de visibilidad, eliminación y limpieza de archivos sin destruir una referencia compartida.
- Bucket de medios privado y comprobación autenticada de esa configuración antes de subir.
- Directorio anónimo operativo sin exponer las habilitaciones privadas de cuentas.
- Servicios inactivos visibles exclusivamente para su propietario.
- Una identidad con espacios Empresa y Cliente; rechazo de habilitaciones para otra identidad.
- Conversaciones y adjuntos privados entre sus participantes; rechazo de otros propietarios y mensajes con un contexto falso.
- Actualizaciones repetidas de cursores de lectura bajo los permisos del cliente.
- Fechas de nuevos mensajes asignadas por PostgreSQL, rechazando fechas futuras o pasadas proporcionadas por la API.

## Resultado registrado

En esta revisión se han aplicado **12 migraciones secuenciales y pasado 47 aserciones**, con PostgreSQL **17.11** en un contenedor local. La primera ejecución detectó un error real de permisos de `account_types` que impedía la lectura anónima del directorio; la migración correctiva lo resuelve manteniendo cero filas visibles para `anon`.

## Límites

Estas pruebas verifican el motor SQL, sus privilegios y las políticas, con esquemas auxiliares reducidos. No implementan ni verifican GoTrue, SMTP, PostgREST, el servidor HTTP de Storage, la firma o caducidad efectiva de URLs, cachés/CDN, carga de bytes, antivirus ni el despliegue de Supabase.

Al retirar una publicación, RLS impide nuevas lecturas autorizadas de su archivo. Los enlaces emitidos por esta versión duran 60 segundos, aunque otros clientes autorizados podrían solicitar duraciones distintas; la suite SQL no simula ese token HTTP. Las copias descargadas previamente no pueden retirarse del dispositivo de otra persona.

La migración `0012` está preparada para revisión y **no se ha aplicado a ningún backend remoto**. Antes de utilizar datos reales, probarla en un proyecto Supabase de desarrollo con cuentas distintas, comprobar las URLs públicas heredadas y firmadas mediante HTTP y revisar copias de seguridad, políticas existentes y la publicación coordinada del frontend.
