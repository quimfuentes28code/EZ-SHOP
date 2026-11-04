# Reorganización de Cliente y Empresa — 31/10–04/11/2026

Base inspeccionada: `main`, `79d6abe`. Rama: `codex/reorganizacion-navegacion`. Se creó un checkout independiente en `/workspace/EZ-SHOP-navigation`; el trabajo pendiente de herramientas en `/workspace/EZ-SHOP` se conserva sin incorporar sus cambios de esquema o negocio a esta revisión visual.

## Inventario de compatibilidad previo a la implementación

| Área existente | Acciones y datos conservados | Ubicación reorganizada |
| --- | --- | --- |
| `/cliente`, Explorar | Buscar negocio/servicio, localidad, categoría, favoritos, acceso al mapa/perfil | Explorar, con Para ti, Siguiendo y Cerca de mí |
| Cliente, novedades | Posts reales de negocios guardados y sus fotos/vídeos firmados | Explorar → Siguiendo; `?vista=novedades` compatible |
| Cliente, actividad | Solicitudes, fechas, notas y estados propios | Perfil → Mi actividad; `?vista=actividad` compatible |
| Cliente, favoritos | Añadir/retirar guardados persistidos | Favoritos y fuente única de Siguiendo |
| Cliente, mapa | Coordenadas voluntarias, filtros, marcadores y acceso a empresa | Mapa; sin pedir geolocalización automáticamente |
| Cliente, mensajes | Hilos, historial, adjuntos y lectura | Mensajes, conservado al cambiar de pantalla |
| Cliente, datos y sesión | Perfil global, experiencia y cierre de sesión | Perfil y menú Cuenta |
| `/cliente?negocio=<uuid>` | Perfil comercial actual, portada, logo, métricas, tabs internas, servicios, publicaciones, portfolio, sedes y acciones | Mismo perfil público y datos, diferenciado de la navegación principal |
| `/empresa`, panel | Empresa activa, métricas y solicitudes | Inicio, con actividad y planificación reales disponibles |
| Empresa, workboard | Proyectos, agenda interna, órdenes, encargos y presupuestos borrador existentes | Agenda; también accesible desde Gestión |
| Empresa, CRM/servicios/solicitudes | Contactos autorizados, catálogo y estados | Gestión y grupos de escritorio |
| Empresa, sedes | Crear/editar/borrar sede, horarios, coordenadas y consentimiento | Gestión → Tiendas y sedes; Perfil → Sedes y contacto como acceso contextual |
| Empresa, herramientas | Accesos reales, configuración destacada y módulos previstos | Gestión → Herramientas; grupo propio en escritorio |
| Perfil público y Diseño del perfil | Información, medios, colores, orden/visibilidad de bloques, publicaciones, publicar/ocultar, vista Cliente | Una experiencia Perfil, un editor persistente y subsecciones; alias `editor=diseno`/`vista=diseno` |
| Cuenta Empresa | Datos personales de propietario, cambio de experiencia, tema y sesión | Menú Cuenta, separado del perfil comercial |
| Organizaciones históricas | Selección de empresa y aislamiento de servicios/CRM/sedes/chat | Selector único de cabecera; las sedes siguen siendo hijas de la empresa |
| Registros y demos | Registro real y activación de ambos espacios; demos explícitas en sus rutas | Sin enlace demo desde el panel conectado; ninguna operación real redirige a datos ficticios |

## Implementación

- Configuración de navegación común en `src/lib/app-navigation.ts`; componentes reutilizables en `src/components/app-navigation.tsx` y su CSS.
- Cinco destinos móviles por experiencia, navegación de Cliente para escritorio y Empresa agrupada por función.
- Menú Cuenta accesible con foco, Escape, cambio de experiencia, tema, actualizar y cerrar sesión. No se añade una campana sin un sistema de notificaciones.
- Explorar combina empresas publicadas, servicios y publicaciones reales. Describe su criterio de ordenación; no simula recomendaciones personalizadas ni distancias.
- Perfil Cliente separa identidad, datos, actividad y configuración. Conserva parámetros de navegación y vuelta desde perfiles.
- Empresa reúne la gestión en un hub y mantiene los módulos existentes; el editor comercial tiene información, apariencia, servicios, publicaciones, sedes, visibilidad y vista Cliente.
- La vista previa abre `/cliente?negocio=<uuid>`: utiliza exactamente la misma implementación y los mismos datos públicos que Cliente. Un perfil privado no se representa como publicado ni se habilita automáticamente el otro espacio de la identidad.
- El nuevo diseño de perfil público de `79d6abe` se conserva. No se altera la autenticación, el esquema ni la autorización de Supabase.
- El chat conserva borradores/adjuntos al cambiar de sección. La propiedad de presentación `active` pausa consultas y confirmaciones de lectura mientras su panel está oculto; no concede permisos.
- `viewport-fit=cover`, áreas seguras, controles táctiles y espacio inferior protegen el contenido. La navegación inferior se oculta al reducirse el viewport por el teclado, sin desmontar el formulario.
- Cada experiencia tiene un único elemento `main` y un enlace para saltar al contenido que funciona con teclado. Los menús de cuenta cierran con Escape y recuperan el foco.
- Los presupuestos conservan tipo, importe y notas al salir de Agenda. Los vídeos del editor se pausan cuando se ocultan, también durante la renovación de sus enlaces firmados.
- Se corrige la lista «Organizar perfil público» comunicada el 04/11: los estilos generales de campos de texto ya no se aplican a checkbox/radio. Cada fila separa el check de 18 px, su etiqueta y las dos flechas de 44 px; las etiquetas pueden partirse sin quedar debajo de los controles. Las regresiones de 390, 900 y 1440 px comprueban geometría, clic en etiqueta, orden, guardado y recarga.

## Archivos y responsabilidades

| Archivos | Cambio |
| --- | --- |
| `src/lib/app-navigation.ts`, `src/components/app-navigation.tsx`, `src/components/app-navigation.css` | Configuración única de destinos, cinco accesos móviles, grupos profesionales y acciones de cuenta |
| `src/components/customer-social.tsx`, `src/components/customer-social.css` | Explorar, fuentes reales, Perfil/actividad, navegación y compatibilidad de enlaces |
| `src/components/real-experience.tsx`, `src/components/business-home.tsx`, `src/app/real/real.css` | Shell profesional, cabecera/selector, hub Gestión, perfil unificado, resumen real y enlaces antiguos |
| `src/components/business-social-editor.tsx`, `src/components/business-video.tsx` | Subsecciones del editor persistente y pausa de vídeos ocultos |
| `src/components/business-workboard.tsx`, `src/components/social-inbox.tsx` | Preservar borradores; pausar efectos de presentación del chat oculto |
| `src/components/site-chrome.tsx`, `src/app/layout.tsx`, `src/app/globals.css` | Jerarquía accesible, viewport de iPhone y ocultación efectiva de paneles persistentes |
| `tests/e2e/*navigation.spec.ts`, `tests/e2e/unified-profile-editor.spec.ts`, `tests/unit/app-navigation.test.ts` | Nuevas regresiones de navegación, editor, contexto, teclado y responsive |
| Pruebas anteriores de cuentas, módulos, chat, mapa, medios, organizaciones, diseño y vídeo; `tests/e2e/helpers/navigation.ts` | Adaptar recorridos al menú real conservando sus aserciones funcionales |
| `playwright.config.ts`, `.github/workflows/verify-prototype.yml` | Motor WebKit opcional y verificación continua además de Chromium |

Los cambios no incorporan dependencias, tablas, migraciones ni módulos futuros. CRM, RLS, organizaciones, sedes, servicios, solicitudes, conversaciones y archivos conservan sus implementaciones existentes. Las herramientas previstas siguen identificadas con su disponibilidad real.

## Botones y menús reubicados

Actualizar, tema, experiencia y cerrar sesión pasan al menú Cuenta. Los datos del propietario quedan en Mi cuenta; el escaparate comercial queda en Perfil. Clientes, servicios, solicitudes, proyectos, sedes y herramientas se agrupan en Gestión. Diseño deja de ser una segunda pantalla que duplica el editor completo. Las pestañas internas del perfil público conservan su propia navegación.

## Validación y límites

La instalación usa `npm ci` con el lockfile existente y no añade dependencias. Las cuentas y datos de E2E son sintéticos y las peticiones a Supabase se interceptan: no se modifican datos privados del propietario para preparar capturas.

Validación local del 04/11: `npm run typecheck`, **72 pruebas unitarias**, `npm run build` y **85 pruebas E2E en Chromium**, todas superadas. Incluye las tres regresiones de checks, orden y guardado a 390/900/1440 px y los controles de reproducción/pausa de vídeo tras renovar URLs. Los fallos intermedios de adaptación a menús, borradores y vídeo quedaron corregidos; la última ejecución completa no tiene fallos.

La suite SQL existente pasó **74 comprobaciones sobre 19 migraciones** en PostgreSQL desechable; esta entrega no introduce ni aplica migraciones. CI vuelve a ejecutar SQL y la suite completa e incluye los recorridos de navegación/editor/vídeo en WebKit antes de integrar.

Las capturas y los tamaños móviles corresponden a navegadores automatizados, no a un iPhone físico. WebKit se ejecuta en el contenedor oficial de Playwright, aislado de la red. No equivale a certificar Safari de iOS ni una PWA instalada en un dispositivo. El teclado se comprueba mediante foco y cambios de viewport; su comportamiento final en cada sistema requiere también revisión en dispositivo. Tampoco se certifican sesiones privadas de producción sin disponer de cuentas de prueba autorizadas; la verificación publicada debe distinguir rutas públicas de recorridos autenticados interceptados.

## Capturas del resultado

Capturas reales de la interfaz renderizada en Chromium, con cuentas sintéticas de E2E; esos registros no se incorporan a producción.

- [Cliente móvil](previews/navigation-client-mobile.png)
- [Empresa móvil](previews/navigation-business-mobile.png)
- [Cliente escritorio](previews/navigation-client-desktop.png)
- [Empresa escritorio](previews/navigation-business-desktop.png)

## Integración y publicación

Esta rama se integra mediante Pull Request después de validar. Cloudflare conserva su despliegue automático de `main`. La fusión por sí sola no demuestra publicación: comprobar el estado de Workers Builds y que `https://autonoservice.quim-fuentes28.workers.dev/version.json` identifica el commit integrado, además de probar las rutas publicadas. El resultado final y los enlaces de commit/PR se registran en la entrega.

## Comprobación visual

1. Entrar en Cliente desde móvil: comprobar los cinco accesos inferiores, cambiar entre Para ti/Siguiendo/Cerca de mí y conservar búsqueda/localidad al volver.
2. Abrir un negocio desde lista o mapa: comprobar portada, pestañas propias y acciones; cerrar con Escape o Atrás y recuperar el origen.
3. Ir a Perfil → Mi actividad y comprobar solicitudes. Abrir Cuenta para tema, actualizar, cambiar de experiencia y cerrar sesión.
4. En Empresa móvil: Inicio → Agenda → Mensajes → Gestión → Perfil. Usar Gestión para clientes, catálogo, solicitudes, sedes y herramientas.
5. En Perfil de Empresa: guardar apariencia, portada y distribución; abrir Ver como Cliente y comprobar la misma portada y secciones desde Cliente.
6. En escritorio: comprobar los grupos de la barra lateral y cambiar de empresa desde la cabecera. Las sedes y conversaciones deben corresponder al contexto seleccionado.
