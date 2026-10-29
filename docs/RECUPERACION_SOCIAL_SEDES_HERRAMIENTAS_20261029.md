# AutonoService — Recuperación de red social y herramientas reales (29-10-2026)

## Diagnóstico de la regresión

La sustitución de las rutas de prototipo `/cliente` y `/empresa` por `RealExperience` conectó Supabase, pero dejó fuera la experiencia social y muchos módulos visuales. Esta revisión recupera perfiles enriquecidos, novedades y herramientas sobre datos reales, sin volver a mostrar empresas de ficción como si fueran inscritas.

## Identidad y estructura

- Una persona se identifica con un único correo y contraseña, habilita Cliente y Empresa y comparte su perfil personal.
- Cada cuenta Empresa creada desde ahora puede registrar una sola empresa. Dentro de ella puede crear varias tiendas o sedes con nombre, dirección, modalidad, horarios y ubicación.
- Las dos empresas de desarrollo previamente creadas, RedMoonStudios y RedMoonCorp, se conservan de forma independiente, sin fusionar sus datos automáticamente.
- Se crea una sede principal privada para cada empresa histórica; no se publican direcciones sin consentimiento.

## Empresa

### Ya conectado a PostgreSQL y Storage

- Perfil empresarial editable: nombre, categoría, localidad, descripción, eslogan, color, logo y portada.
- Publicaciones auténticas: textos, imágenes JPG/PNG/WebP y vídeos MP4/WebM, con opción público/borrador. El bucket histórico se llama `autonoservice-public-media`; la corrección 0012 lo convierte en privado. La app guarda referencias `storage://`, resuelve también URL propias antiguas y firma sólo los medios permitidos por RLS.
- Servicios y catálogo de precios.
- CRM de contactos vinculados a solicitudes.
- Solicitudes con estado.
- Chat privado de todos los negocios históricos desde la misma bandeja; actor `business` diferenciado de `customer` aunque compartan `auth.users.id`.
- Archivos de chat y marcadores de lectura por contexto; los adjuntos viajan por bucket privado `autonoservice-private-chat` con URL firmada de duración limitada.
- Refresco de chat aproximadamente cada 6 segundos y al recuperar foco; no hay push móvil.
- Agenda **interna** (no reserva pública), proyectos, órdenes de trabajo, encargos internos y presupuestos **borrador** mediante `business_work_items`.
- Preferencias de módulos destacados por empresa. Herramientas disponibles visibles primero; futuras funciones ocultas por defecto en sección desplegable.
- Sedes con horarios y posición de mapa elegida por el propietario. Posición precisa optativa; mapa en Cliente solo muestra sedes publicadas.

### No implementado todavía

- Reservas automáticas con motor de disponibilidad y controles de concurrencia.
- Gestión especializada de inventario, stock, recursos, personal, academias, plazas y todos los sectores catalogados.
- Facturación fiscal y pagos.
- Push móvil, bloqueo/reporte de usuarios, antivirus/moderación de adjuntos y cuotas comerciales.
- Edición avanzada de apariencia por widgets, perfiles de empleados y permisos delegados.

## Cliente

- Explorar empresas reales, con buscador, categorías y localidad.
- Guardar favoritos, ver actividad y solicitar servicios.
- Novedades reales de negocios favoritos y perfiles públicos con logo, portada, publicaciones y servicios.
- Mensajes directos de texto/archivos, indicadores de no leídos, historial privado y refresco periódico.
- Mapa interactivo de OpenStreetMap (Leaflet 1.9.4), sin geocodificar automáticamente ni inventar coordenadas. Las empresas sitúan voluntariamente un pin mediante un clic; el mapa muestra solo sedes publicadas.
- Una identidad y un perfil personal compartidos con Empresa; cada organización conserva su ficha comercial y CRM privados.

## Seguridad y rendimiento

Migraciones en orden:
- `0006_one_business_branches.sql`: límite de empresa nueva y RLS de sedes.
- `0007_real_business_modules.sql`: registros internos y módulos personalizables.
- `0008_business_social_profiles.sql`: publicaciones, identidad visual y bucket de medios públicos.
- `0009_chat_attachments_unread.sql`: archivos privados y estado leído por contexto.
- `0010_opt_in_location_coordinates.sql`: latitud/longitud voluntarias y protegidas.
- `0011_read_state_upsert_permissions.sql`: permisos de upsert del estado de lectura.
- `0012_media_privacy_and_profile_permissions.sql`: corrección preparada de permisos de personalización, servicios activos y acceso privado a medios; no aplicada al backend por esta revisión.

Con 0012 aplicada, el propietario puede consultar medios de borradores; los demás lectores necesitan una referencia publicada vinculada al objeto y una empresa pública. Los adjuntos de conversaciones permanecen en otro bucket privado. La nueva UI comprueba la disponibilidad de la corrección antes de subir o retirar medios. Hay que ensayar y coordinar la migración con la versión del frontend que firma las referencias antiguas, para evitar que una versión anterior siga solicitando URL públicas del bucket convertido.

Los enlaces generados por esta app caducan a los 60 segundos y se renuevan durante la visualización. Es una configuración de esta versión: otros clientes autorizados pueden solicitar al proveedor otro tiempo de firma. Retirar o eliminar una publicación corta nuevas firmas no autorizadas, pero no borra descargas, copias o cachés previas. Las referencias externas HTTPS heredadas se conservan por compatibilidad y no pueden retirarse mediante nuestras políticas de Storage. No utilizar las publicaciones para documentos privados de clientes.

La migración está preparada para revisión y validación, no aplicada al proyecto remoto. Véanse [PULIDO_20261029.md](PULIDO_20261029.md) y [PRUEBAS_SQL.md](PRUEBAS_SQL.md).

El visor de mapas usa teselas web de OSM exclusivamente para navegación interactiva humana. Mantiene atribución visible, no descarga mapas offline, no usa la API pública de geocodificación Nominatim. Para producción a escala habrá que contratar un proveedor de teselas/geocodificación con SLA y revisar cuotas y políticas: https://operations.osmfoundation.org/policies/tiles/

## Verificación manual en Cloudflare

1. Confirmar la última compilación como `Ready`.
2. Iniciar sesión Empresa, abrir **Mensajes**: debe aparecer el mensaje Cliente enviado previamente a RedMoonStudios aunque estuviera seleccionado RedMoonCorp. Un badge marca mensajes aún no leídos.
3. Abrir **Perfil público**, modificar eslogan o color, subir portada/imagen de prueba y publicar una novedad. Ver desde Cliente en **Novedades** y perfil público.
4. Abrir **Tiendas y sedes**; editar la sede principal, colocar un pin en Terrassa, y marcarla como pública. Ver el pin en **Mapa** de Cliente. Si no se publica el pin, el mapa no debe mostrarlo.
5. Crear un registro interno en **Proyectos y agenda**; recargar y comprobar persistencia.
6. En **Herramientas**, destacar/desmarcar módulos; guardar, recargar y comprobar que la selección se mantiene.
7. En Cliente, enviar texto y un archivo permitido; debe llegar en Empresa y poder descargarse mediante URL firmada. Repetir la prueba en otra identidad para verificar separación.
8. Comprobar diseño y formularios en móvil.

No se ha ejecutado una sesión autenticada real del usuario desde el navegador del asistente. Las pruebas SQL transaccionales de roles e integración no sustituyen las pruebas de extremo a extremo con cookies reales en el navegador publicado.
