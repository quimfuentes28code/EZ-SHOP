# Auditoría técnica de la web publicada — 30/10/2026

URL comprobada: `https://autonoservice.quim-fuentes28.workers.dev/`

## Alcance real

Auditoría externa desde GitHub Actions/Chromium contra la web pública, no una reproducción local:
- 9 rutas × 2 variantes (escritorio de 1440 px y emulación móvil iPhone 13): portada, registros, accesos, selector, explorar y dos demostraciones.
- Estado HTTP, redirecciones, contenido visible, errores JS en cliente, respuestas fallidas de activos propios y Supabase, capturas, revisión de desbordamiento horizontal.
- Conmutación «Acceder / Crear cuenta» en los dos registros, en ambos tamaños.
- Revisión de migraciones, GRANT y RLS de Supabase; consulta de eventos reales de Storage y errores HTTP. Pruebas SQL dentro de transacciones revertidas.
- Comprobación GitHub de TypeScript, tests y exportación Next.js estática.

**Resultados de la web pública:** 18/18 rutas 200 sin errores JavaScript detectados; las páginas /cliente y /empresa sin sesión redirigen al registro correspondiente; los formularios cambian a modo acceso sin fallos; sin desbordamiento horizontal detectado a los tamaños revisados.

**Importante:** «móvil» fue emulación de tamaño y agente de navegador bajo Chromium, no una ejecución real en iOS Safari. No se han introducido credenciales personales, creado cuentas confirmadas ni tomado sesiones ajenas: por tanto no se afirma que se hayan completado de punta a punta los flujos autenticados.

## Incidencias concretas encontradas y corregidas

1. **ALTA — Los logos, portadas y fotos de Empresa no se subían.** Registros de Storage confirman 400 `InvalidParameter`, error PostgreSQL `22P02` al convertir `RedMoonStudios` a UUID. La política Storage referenciaba `name` sin cualificar dentro de una subconsulta, resolviéndose como `organizations.name`. Migración `20261030_0001_fix_business_media_rls.sql`: se utiliza la ruta exterior `storage.objects.name` y conversión segura. Probado bajo RLS real: inserción de carpeta del propietario aceptada; carpeta ajena y nombre inválido rechazados.
2. **ALTA — Cambios visuales de perfil no se podían guardar.** `organizations.tagline`, `accent_color`, `avatar_url` y `cover_url` no tenían permiso UPDATE para el rol `authenticated`. Migración `0002_grant_business_branding_columns.sql`. Comprobado: propietario puede guardar; usuario ajeno no puede.
3. **MEDIA — La bandeja de Empresa mezclaba chats personales con profesionales si una identidad activaba ambos roles.** RLS permitía ver ambos contextos; el cliente tiene que filtrar además por la lista de organizaciones propias. Componente `social-inbox.tsx` corregido.
4. **MEDIA — El selector del prototipo salía del modo demostración y llevaba a las rutas de cuenta real.** Componente `experience-switcher.tsx` corregido para conservar modo demo dentro de `/demo/`, `/explorar`, `/mensajes`, etc.
5. **PRIVACIDAD — Los borradores con foto o vídeo daban una falsa impresión de privacidad aunque sus ficheros estuvieran en un bucket público.** Se impide crear borradores multimedia públicos bajo apariencia privada; para retirar una publicación con media se utiliza eliminación explícita; se añade policy de limpieza de archivos por propietario (migración 0004). No se publica material privado por equivocación desde esta interfaz. Los ficheros que ya se habían compartido pueden seguir existiendo en copias ajenas.
6. **RENDIMIENTO — 9 claves externas sin índice.** Migración `0003_index_relational_foreign_keys.sql` resuelve advertencias de los asesores de Supabase. Los índices nuevos todavía aparecen como «sin usar» porque no ha habido carga significativa, lo cual es normal.

## Pendientes y riesgos de producto

- **Crítico antes de apertura pública:** habilitar «Leaked Password Protection» en Supabase Auth; sigue desactivada según el asesor de seguridad.
- **E2E autenticado pendiente:** registrar y confirmar un nuevo usuario, activar ambos espacios con un mismo email, editar datos, subir archivo real desde navegador, abrir chat con Cliente distinto, guardar borradores/adjuntos, comprobar notificaciones y RLS entre identidades. Las pruebas SQL ya verifican permisos importantes pero no cubren la interacción web real después de login.
- **Compatibilidad:** no se ha verificado Safari real, Firefox, lectores de pantalla ni funcionamiento completo con conectividad lenta. El mapa usa Leaflet y teselas de OpenStreetMap; requiere disponibilidad de CDN/teselas y futura política de proveedor de mapas para producción a escala.
- **Producto no terminado:** citas y reservas con disponibilidad, facturación legal, pagos, controles antispam/moderación de mensajes, notificaciones push, accesibilidad avanzada y herramientas completas por sector.
- **Contenido demo:** las rutas públicas `/explorar`, `/demo/cliente` y `/demo/empresa` mantienen datos ficticios explícitamente identificados como demostración. No deben confundirse con los perfiles reales de la cuenta Cliente.

## Cómo reproducir la auditoría de navegador

La tarea de GitHub Actions «Live published site browser audit» ejecuta:

```shell
npm ci
npx playwright install --with-deps chromium
node scripts/audit-live.mjs
```

Registra capturas de rutas públicas y mediciones de navegación, consola y desbordamiento. La cuenta de pruebas y los tests autenticados necesitarán un mecanismo seguro de aprovisionamiento y eliminación temporal, sin guardar contraseñas ni secretos en el repositorio.

**Estado:** Correcciones de Supabase ya aplicadas en el proyecto dev; cambios de interfaz y pruebas gestionados mediante el PR de esta auditoría. No equivale a confirmar automáticamente un despliegue actualizado de Cloudflare después de la fusión del PR.
