# Recuperación del diseño social y conexión real con Supabase

## Diagnóstico confirmado

Las rutas originales `/cliente` y `/empresa` se sustituyeron por un componente `RealExperience` orientado a gestión CRUD. Los prototipos con tarjetas, favoritos, perfiles y chat continuaron en `/demo/cliente`, `/demo/empresa`, `/explorar` y `/mensajes`, pero con datos locales/ficticios.

El objetivo NO es reactivar un prototipo como si fuera real. Debemos reconstruir las pantallas de descubrimiento social sobre la misma cuenta autenticada y el mismo backend multiempresa, conservando el diseño claro aprobado.

## Restauración de Cliente

- /cliente vuelve a tener navegación **Explorar / Mi actividad / Favoritos / Mensajes / Mi perfil**, sin convertirse en una aplicación distinta.
- Explorar lista empresas reales publicadas, con búsqueda por texto, sector y localidad; muestra perfiles, catálogo de servicios, detalles y botón de solicitud.
- Favoritos se almacenan en Supabase y quedan vinculados al cliente autenticado.
- Mi actividad presenta solicitudes reales y sus estados, sin negocios o reservas ficticios.
- Mi perfil edita `person_profiles`, la identidad compartida con Empresa. Los perfiles **comerciales** permanecen asociados a la organización.
- Mensajes permite iniciar una conversación al contactar con una empresa publicada, enviar texto y recibir respuesta en la bandeja empresarial.
- No hemos creado un feed de publicaciones multimedia. Los perfiles usan una cubierta abstracta por categoría, no fotografías falsas.

## Mensajería real y privacidad

Migración: `supabase/migrations/20261029_0005_social_favorites_messaging.sql`.

- `customer_favorites`: privado por cliente.
- `conversations`: un hilo por pareja Cliente / Negocio, con snapshot de nombre autenticado cuando el Cliente inicia conversación.
- `conversation_messages`: mensajes de texto inmutables; `actor_role` identifica el contexto Empresa / Cliente, incluso si ambos utilizan el mismo login.
- RLS exige identidad autenticada, membresía apropiada y propiedad o participación. Usuarios ajenos no pueden leer conversaciones ni favoritos de otros.
- Los clientes inician conversación con negocio publicado. Las empresas responden desde el buzón del negocio activo. No se exige una solicitud previa.
- Los chats necesitan controles adicionales antes de difusión pública: protección antispam/rate limit, reporte y bloqueo, retención y exportación/borrado, seguridad de archivos, notificaciones push y tiempo real.
- La actualización de mensajes es manual. No se afirma que exista conexión instantánea o intercambio de archivos.

## Herramientas empresariales

La empresa mantiene el panel real de Inicio, Perfil público, Servicios, Clientes, Solicitudes y Herramientas. Se añade **Mensajes** como función real. Los módulos no operativos se siguen mostrando como `En desarrollo`.

## Siguientes iteraciones

1. Perfiles públicos enriquecidos: foto de portada, galería, publicaciones, datos comerciales, horarios y categorías con permisos y almacenamiento seguro.
2. Feed de novedades de empresas seguidas y búsqueda avanzada, con herramientas para publicar y moderar.
3. Mapa interactivo real de empresas con datos de localización y consentimiento, sin direcciones inventadas.
4. Personalización modular por negocio, widgets visibles, herramientas según sector.
5. Reservas con disponibilidad y controles de concurrencia; pagos, presupuestos, facturación conforme a normativa.
6. Mensajes en tiempo real y adjuntos privados con políticas Storage.

## Pruebas mínimas antes de usar datos reales

- Test TypeScript y build.
- Migración 0005 en Supabase development.
- Dos empresas / dos clientes ficticios: chat bidireccional, favoritos propios y bloqueo RLS al resto.
- Iniciar sesión con una sola identidad activada en Empresa y Cliente y verificar la navegación sin perder la cuenta o los negocios.
- Revisar desktop y móvil. No introducir clientes reales hasta validar la moderación y la privacidad.
