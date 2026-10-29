# Roadmap de AutonoService

La secuencia sigue la [especificación maestra](ESPECIFICACION_MAESTRA.md). Las interfaces de demostración pueden anticipar un recorrido futuro, pero no significan que el dominio o la infraestructura estén implementados. No se avanza de hito sin revisión explícita.

## Hito 0 — Arquitectura y prototipos (actual)

- Inventariar y conservar el código existente y sus dependencias.
- Aplicar AutonoService como marca principal, Cliente como experiencia gratuita y AutonoSuite como mejora profesional.
- Diseñar sistema visual, temas claro/oscuro y componentes accesibles y responsive.
- Primera entrada con dos opciones, onboarding profesional y personal, selector Mi negocio/Modo cliente y recuerdo de experiencia.
- Panel profesional sencillo y panel Cliente con Explorar, Mi actividad, Favoritos y Perfil.
- Prototipo de Mi plan, precio provisional y comparación de capacidades sin pagos reales.
- Conservar perfiles, catálogo, conversaciones y solicitudes locales de demostración; distinguirlos de servicios de producción.
- Definir identidad global, roles contextuales, módulos sectoriales, arquitectura multiplataforma y evaluación local-first.
- Preparar instrucciones de pruebas en iPhone y Android; no afirmar que existe una aplicación Expo/TestFlight sin haberla creado.
- Ejecutar TypeScript, unitarias, build y recorridos relevantes en navegador.

**Salida verificable:** prototipo navegable sin errores pendientes de compilación, inventario de capacidades, documentación coherente y resultados registrados en `NOTAS_PRUEBAS.md`. La aprobación visual del propietario permanece pendiente hasta que la otorgue.

## Hito 1 — Núcleo de la plataforma (no iniciado)

- Usuarios y perfil global con un único sistema de autenticación.
- Empresas, sedes y membresías contextuales para propietarios, administradores y empleados.
- Sectores y configuración de módulos versionados.
- Estructura de Cliente y vínculo verificado con contactos de cada empresa.
- Autorización en servidor y RLS, acceso a archivos privados y auditoría básica.
- Selector de experiencia/empresa validado contra membresías vigentes.

**Salida:** dos empresas y usuarios con roles distintos; pruebas que intenten acceder, modificar o descargar datos cruzados deben fallar. Ocultar menús no se acepta como evidencia de aislamiento.

## Hito 2 — Herramientas básicas de AutonoService

- CRM, agenda local, trabajos, proyectos sencillos y presupuestos básicos.
- Límites de la versión gratuita validados y comunicados.
- Primer adaptador local persistente y políticas de copia/migración para los datos implementados.
- No convertir borradores offline en operaciones online confirmadas.

**Salida:** flujo útil del primer piloto, persistencia y recuperación verificadas, permisos contextuales comprobados y exportación de los datos implementados.

## Hito 3 — Reservas y conexión con clientes

- Servicios reservables, recursos y disponibilidad.
- Solicitudes, confirmaciones y condiciones de modificación/cancelación.
- Historial de actividad propio de Cliente.
- Mensajería/entregas reales sólo cuando participantes, almacenamiento y acceso privado estén verificados; su prototipo ya puede existir en Hito 0.
- Idempotencia, concurrencia, zonas horarias y notificaciones delimitadas.

**Salida:** dos solicitudes simultáneas no confirman el mismo recurso/capacidad por encima de sus reglas; un cliente sólo accede a sus operaciones. Las confirmaciones requieren autoridad del dominio y no un estado local manipulado.

## Hito 4 — Primeros sectores especializados

- Fotografía y vídeo: sesiones, presupuestos, proyectos y entregas.
- Un negocio de citas, por ejemplo peluquería.
- Un negocio de pedidos, por ejemplo pastelería.
- Identificar extensiones justificadas sin duplicar clientes, identidad, permisos o componentes comunes.

**Salida:** los tres pilotos comparten el núcleo y conservan reglas distintas para citas, encargos y proyectos. Añadir un sector no exige otra aplicación.

## Hito 5 — Directorio

- Publicación voluntaria de perfiles reales con consentimiento y moderación.
- Categorías, búsqueda por ciudad, servicios y precios publicados.
- Cobertura para local, domicilio, online, varias sucursales y varias zonas.
- Filtros, favoritos y accesos a las contrataciones operativas.

**Salida:** sólo aparecen negocios que hayan habilitado su perfil público; no se exponen contactos o archivos privados y se puede buscar sin ubicación precisa.

## Hito 6 — Mapa

- Permiso opcional de ubicación, proximidad y búsqueda geográfica.
- Zonas de cobertura y precisión adecuada a cada modalidad.
- Proveedor sustituible, costes, cuotas, privacidad, abuso y comportamiento sin permisos.

**Salida:** resultados verificables y consentimiento claro; buscar por ciudad sigue disponible cuando el usuario rechaza ubicación. No se presentan pines ficticios como negocios reales.

## Hito 7 — AutonoSuite y monetización

- Cerrar titularidad, funciones incluidas, límites y alcance de la licencia.
- Verificación de compras y derechos por versión/plataforma.
- Preservar funciones locales de la última versión adquirida; actualizaciones mayores opcionales.
- Restauración, reembolsos, soporte, seguridad y compatibilidad.
- Estudiar y aplicar compras permitidas por web, App Store y Google Play, con sus condiciones regionales.
- Separar cuotas/costes de servicios online de la licencia local.

**Salida:** pruebas de compra/restauración por canal y versión; una persona que no actualiza conserva sus derechos anteriores y Cliente sigue gratuito. La facturación propia o de comercios no se activa sin revisión de normativa española aplicable.

## Hito 8 — Expansión

- Nuevos sectores, módulos y herramientas avanzadas.
- Integraciones e inteligencia artificial opcional, con límites y costes explícitos.
- Evaluación de cumplimiento para nuevos sectores regulados.
- Valoraciones verificadas y otras capacidades de descubrimiento cuando exista evidencia suficiente.

**Salida:** cada ampliación tiene un caso de uso validado, coste sostenible, permisos, pruebas y documentación. No se incorpora todo el catálogo sin priorización.

## Dependencias transversales

El Hito 1 precede a cualquier dato privado real o operación entre usuarios. Las compras no se habilitan antes de definir licencias y políticas por plataforma. Las decisiones de soporte móvil, almacenamiento local, contratos y migración se toman desde el Hito 0; su implementación se incorpora al hito que consume esa capacidad, sin obligar a terminar todas las plataformas simultáneamente.

Las pruebas históricas de la primera versión se conservan en `NOTAS_PRUEBAS.md` como antecedente. No validan automáticamente la actualización actual de marca, onboarding o permisos demo.
