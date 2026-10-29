# Hito 0 — Arquitectura y prototipos de AutonoService

## Referencia y estado

Esta revisión aplica [ESPECIFICACION_MAESTRA.md](ESPECIFICACION_MAESTRA.md): AutonoService es la marca principal, Cliente es la experiencia gratuita y AutonoSuite mejora la gestión profesional dentro de la misma aplicación. El objetivo es revisar arquitectura y experiencia visual; el Hito 1 no está iniciado ni autorizado por terminar este prototipo.

Los resultados de instalación, TypeScript, pruebas y compilación de la revisión actual se registran en [NOTAS_PRUEBAS.md](NOTAS_PRUEBAS.md). Ya se han comprobado la instalación con `npm ci`, TypeScript, 48 unitarias y la compilación de todas las rutas. Las 27 pruebas de navegador han pasado contra la compilación de producción, sin fallos ni pruebas omitidas. Las comprobaciones de la versión anterior son antecedentes, no pruebas automáticas de estos cambios.

## Inventario del repositorio inspeccionado

| Área | Código encontrado | Alcance real |
| --- | --- | --- |
| Web | Next.js App Router, TypeScript y rutas de las dos experiencias, mensajes y Mi plan | Aplicación web responsive; no app nativa |
| Módulos/sectores | `src/lib/catalog.ts`, 28 plantillas y 25 módulos | Recomendaciones y vistas demo; no todas las funciones del catálogo maestro |
| Configuración | `src/lib/demo.ts` | Normalización de datos locales, Clientes obligatorio y módulos financieros bloqueados |
| Empresa | Inicio sencillo, menú por actividad, clientes, perfil y herramientas | UI con ejemplos; sin permisos de producción |
| Cliente | Actividad, favoritos, preferencias y enlaces a negocios | Datos locales y ficticios; sin identidad verificada |
| Directorio | Cuatro negocios y filtros | Prototipo, sin geolocalización ni comercios reales |
| Perfil/catálogo | `src/features/business-profile/`, `/negocio/[id]` | Editor y consulta de una misma fuente local; fotos pequeñas y catálogo demo |
| Solicitudes | Modelo de solicitudes locales en perfil y actividad | No confirma disponibilidad, no bloquea plazas ni avisa al negocio |
| Conversaciones | `src/features/messaging/`, `/mensajes` | UI y almacenamiento local de demostración; sin entrega a otra persona |
| Identidad/contexto demo | `src/lib/experience.ts`, selector y registro personal | Una identidad de muestra, recuerdo de experiencia y empresa activa; sin autenticación |
| Capacidades/premium | `src/lib/access.ts`, `/mi-plan` | Política pura de rol, módulo, versión y plataforma; sin compra ni autorización de servidor |
| Pruebas | 48 unitarias y 27 E2E correctas; TypeScript y build correctos | La ejecución final está registrada en NOTAS_PRUEBAS.md; el iPhone físico permanece sin verificar |

La inspección revisó los cambios sociales ya iniciados y los conserva. No se reemplazan los perfiles o el catálogo por una segunda fuente de datos para Cliente. Las claves internas heredadas se conservan para evitar borrar preferencias al cambiar la marca.

## Cambios de la especificación maestra en esta revisión

- Primera entrada con la pregunta **¿Cómo quieres utilizar AutonoService?** y las dos opciones correctas.
- Onboarding profesional por pasos y onboarding personal de Cliente, sin crear cuentas reales.
- Selector **Mi negocio / Modo cliente**, recuerdo de la elección y selección de negocio de demostración.
- Marca y eslóganes unificados; eliminación de nombres comerciales obsoletos.
- Panel profesional centrado en tareas y Cliente orientado a Explorar, Mi actividad, Favoritos y Perfil.
- **Mi plan** muestra AutonoService gratis y la mejora AutonoSuite, con 99 € de pago único provisional y sin pagos reales.
- Modelo de capacidades/derechos por versión para revisar la arquitectura; no equivale a verificación de licencia ni autorización de servidor.
- Estrategia de temas claro/oscuro y componentes reutilizables.
- Arquitectura documentada de identidad global, membresías, sectores, local-first y adaptación futura a Expo.

Las rutas nuevas y los controles están implementados como prototipos, con compilación y unitarias comprobadas. La verificación final de navegador está completada; no se describen como servicios operativos de producción.

## Rutas de revisión

| Ruta | Recorrido |
| --- | --- |
| `/` | Elección AutonoService o Cliente |
| `/onboarding` | Datos del negocio, actividad, modalidad y herramientas |
| `/registro` | Preferencias personales de Cliente de demostración |
| `/empresa` | Inicio, clientes, mensajes, perfil y herramientas de la actividad |
| `/empresa?vista=perfil` | Edición de presentación, fotos y catálogo |
| `/cliente` | Actividad, favoritos y perfil personal |
| `/explorar` | Directorio ficticio y filtros |
| `/negocio/photo`, `/negocio/beauty`, `/negocio/bakery`, `/negocio/repairs` | Consulta de perfiles/catálogos de muestra |
| `/mensajes` | Conversaciones vistas desde el contexto de negocio o Cliente |
| `/mi-plan` | Mejora profesional AutonoSuite sin checkout |

## Decisiones que se conservan

- **Núcleo compartido.** Los sectores recomiendan módulos; no generan aplicaciones distintas. Citas, capacidad, pedidos, proyectos y alquileres conservan sus propias reglas.
- **Interacción sencilla.** Hablar con el cliente, compartir archivos, preparar el perfil y consultar el catálogo son accesos directos. No se añaden métricas decorativas que dificulten tareas básicas.
- **Catálogo común.** El negocio edita productos/servicios y Cliente consulta la misma fuente local. Esta especificación no introduce publicación de productos por particulares.
- **Público frente a privado.** Las fotos del negocio están separadas de entregas/adjuntos de conversación. El prototipo no publica archivos de clientes reales.
- **Identidad única.** Cambiar de experiencia no equivale a registrarse de nuevo. Las perspectivas demo no autentican ni verifican membresías.
- **Premium contextual.** Cliente no requiere AutonoSuite. Los derechos profesionales previstos se cruzarán con permiso del miembro, configuración del negocio, versión adquirida y servicios online aplicables.

## Límites de datos y operaciones

La configuración, perfiles, fotos pequeñas, catálogo, preferencias, textos y solicitudes se almacenan sólo en el navegador cuando sus funciones demo lo permiten. No hay sincronización entre equipos, Safari del iPhone y el ordenador. Un archivo de chat mantenido mediante URL de objeto puede dejar de estar disponible tras recargar; la UI debe explicarlo y evitar descargas falsas.

Preparar una reserva no verifica horarios reales, concurrencia, política de cancelación o zona horaria del negocio. La solicitud es un ejemplo no enviado. El perfil visible en `/negocio/[id]` no acredita una publicación consentida en un directorio real. Los precios de catálogo y las cifras son ilustrativos.

No hay autenticación real, RLS, aislamiento de producción, pagos, facturación española operativa, orientación fiscal certificada, mapa conectado, geolocalización real, aplicación Expo publicada o licencia verificada. Tampoco se promete funcionamiento offline completo por usar almacenamiento local.

Las capturas renovadas de `docs/previews/` muestran la entrada en ambos temas, los paneles, Mi plan, el perfil y los mensajes con datos de demostración.

## Cómo revisar

1. Abrir la entrada y recorrer ambas opciones de onboarding.
2. Cambiar entre Mi negocio y Modo cliente; recargar y comprobar el recuerdo de experiencia sin perder el acceso al selector.
3. En la vista profesional, editar el perfil/catálogo y comprobar la misma ficha desde Cliente.
4. Preparar una solicitud de ejemplo para un servicio y revisarla en Mi actividad, siempre marcada como local/no enviada.
5. Revisar conversación y adjuntos de prueba en sus dos perspectivas dentro del mismo navegador.
6. Abrir Mi plan y comprobar que AutonoSuite no exige otra app/cuenta ni presenta un cobro realizado.
7. Probar temas claro/oscuro, móvil, teclado, foco y fallos de almacenamiento.
8. Usar la guía [MOVIL_Y_PRUEBAS.md](MOVIL_Y_PRUEBAS.md) para revisar la web en Safari; Expo Go y TestFlight corresponden al camino futuro.

## Condiciones para continuar

Cerrar las pruebas de esta revisión, recoger la aprobación visual del propietario y acordar el primer piloto. Sólo entonces se puede iniciar el Hito 1 con identidad, membresías, permisos de servidor y RLS. Los flujos reales y las compras se habilitan en sus hitos con las pruebas y políticas que requieren.
