# Arquitectura de AutonoService

## Estado y criterio de evolución

La referencia de producto es [ESPECIFICACION_MAESTRA.md](ESPECIFICACION_MAESTRA.md). Este documento separa el prototipo existente de las decisiones propuestas para producción. La revisión actual sigue en Hito 0: no hay autenticación real, autorización de servidor, RLS, base de datos de producción ni licencia comercial verificada.

El checkout actual es una aplicación Next.js con TypeScript estricto. Se conservarán sus rutas, modelos de demostración y componentes; la propuesta de monorepositorio no obliga a moverlos durante la revisión visual. No se construirán una aplicación por sector ni otra aplicación para AutonoSuite.

## Una identidad, contextos diferentes

```text
Identidad global de persona
├── Perfil personal y preferencias
├── Relaciones verificadas como Cliente
│   └── Sus reservas, pedidos, documentos y conversaciones autorizados
└── Membresías a empresas
    ├── Organización A: propietaria o empleada, según su membresía
    └── Organización B: permisos independientes
```

`Mi negocio / Modo cliente` cambia el contexto de trabajo, no la identidad ni los permisos. La preferencia de última experiencia se almacena por persona/dispositivo; una empresa activa siempre se resuelve entre sus membresías vigentes. No se acepta un `organization_id` enviado por el cliente como prueba de acceso. Si una empresa ya no está disponible, se limpia su selección y se ofrece otra membresía o el modo Cliente.

### Entidades propuestas para el Hito 1

| Entidad | Responsabilidad |
| --- | --- |
| `user`, `profile` | Identidad global y preferencias personales |
| `organization` | Negocio, sin confundirlo con una persona o un sector |
| `membership` | Usuario, organización, estado y rol contextual |
| `branch` | Sede, zona, modalidad y zona horaria |
| `sector_template`, `organization_sector` | Actividad principal/adicional y recomendaciones versionadas |
| `module_definition`, `organization_module` | Catálogo, estado, habilitación y ajustes por organización |
| `customer_relationship`, `client_link` | Contacto privado del negocio y vínculo verificado con una persona |
| `public_business_profile` | Campos explícitamente publicables y consentimiento |
| `conversation`, `conversation_participant`, `attachment` | Participantes y archivos autorizados, separados del contenido público |
| `license`, `entitlement` | Derechos adquiridos por versión, plataforma, titular y alcance |

Es una propuesta de dominio, no migraciones SQL aplicadas. Las operaciones específicas conservan sus propias entidades: citas, reservas de capacidad, pedidos, presupuestos, proyectos, alquileres, estancias y entregas.

### Autorización prevista

- El servidor resuelve identidad, membresía, rol y capacidad para cada operación; PostgreSQL/RLS protege las filas privadas de la organización.
- Los roles iniciales propuestos son propietario, administrador y empleado con capacidades acotadas. No se concede acceso global a datos personales por ser empleado.
- Cliente accede exclusivamente a sus relaciones verificadas y sus operaciones autorizadas. Un negocio no obtiene su historial con otros negocios.
- Las coincidencias de nombre, teléfono o correo no verificado no fusionan identidades o contactos.
- Los archivos privados se sirven tras verificar participantes/propiedad, mediante enlaces firmados de duración limitada. Las galerías públicas no se alimentan de los adjuntos de chat.
- Los accesos de soporte requieren finalidad, privilegio mínimo y auditoría; no existe un rol con acceso indiscriminado por conveniencia de UI.
- Las pruebas cruzadas deben intentar leer y modificar datos de otra organización, cambiar IDs, reutilizar enlaces de documentos, elevar roles y usar membresías revocadas.

**Nada de esto se considera implementado por la navegación demo.** Los parámetros de URL, los toggles locales y los menús ocultos no son controles de seguridad.

## Composición por sectores y dominios

El catálogo actual contiene 28 plantillas y 25 módulos. Se conserva para compatibilidad; el catálogo funcional de 24 áreas de la especificación maestra es el objetivo de producto, no una equivalencia uno a uno ni una obligación de cambiar todos los identificadores ahora.

Una definición de módulo deberá declarar identificador estable, versión, estado, capacidades, requisitos, incompatibilidades justificadas y alcance offline/online. La plantilla recomienda una composición: no contiene todo el comportamiento del módulo ni decide permisos por sí sola. Las actividades adicionales agregan recomendaciones y se deduplican; el usuario puede revisarlas.

Estados de capacidad: `planned`, `preview`, `beta`, `stable`, además de una marca de revisión regulatoria cuando proceda. La habilitación por negocio, la autorización del miembro, la licencia y la disponibilidad del servicio online son condiciones distintas.

| Dominio | Reglas que no deben mezclarse |
| --- | --- |
| Citas | Duración, profesional, descansos, zona horaria y prevención de solapes |
| Capacidad | Mesas, plazas, grupos y simultaneidad |
| Pedidos/encargos | Personalización, preparación, recogida o envío |
| Presupuestos | Versiones, vigencia y aceptación |
| Proyectos/trabajos | Hitos, tareas, asignados y entregables |
| Alquiler | Activo, intervalo, devolución y disponibilidad |
| Alojamiento | Noches, unidad, check-in y políticas |
| Membresías | Créditos, renovación y condiciones |

No se introduce una tabla o megaformulario universal `transactions` que reemplace estos dominios. Los eventos compartidos contienen referencias y contratos estables sin borrar sus reglas específicas.

## AutonoSuite: permisos y derechos por versión

Cliente es gratuito y no está sujeto a un permiso premium. AutonoSuite mejora las funciones profesionales dentro de la misma aplicación.

Modelo propuesto de derecho adquirido:

```text
License
  id, holder_type, holder_id
  product = AutonoSuite
  edition_version, acquired_at, purchase_channel
  covered_capability_versions[], supported_platforms[]
  receipt_reference, verification_status

Capability decision
  actor + organization + membership permission
  + module enabled + module compatibility
  + acquired entitlement when required
  + online service policy when the action needs infrastructure
```

No basta con un `isPremium` editable en el navegador. El Hito 0 puede mostrar comparaciones o estados de ejemplo, pero no crear una prueba de compra. La titularidad de la licencia —persona o negocio, dispositivos y transferencias— y la matriz exacta de funciones/límites deben cerrarse antes de vender.

La licencia perpetua conserva las capacidades locales de la versión adquirida. No se aplicará una caducidad artificial a esas capacidades por rechazar una actualización mayor. Una actualización opcional puede añadir derechos; no revoca los anteriores. Los permisos de empresa y el acceso a datos de terceros siguen sujetos a membresías vigentes aunque exista una licencia.

La sincronización, almacenamiento remoto, reservas públicas y servicios de IA requieren una política aparte, con cuotas y condiciones sostenibles. No se promete infraestructura ilimitada con el pago único. La compatibilidad técnica, soporte y correcciones de seguridad tienen una política explícita independiente del derecho a utilizar las capacidades locales adquiridas.

### Canales de compra: decisión pendiente de validación

| Canal | Consideración antes de implementar |
| --- | --- |
| Web | Proveedor, recibos, restauración, impuestos, reembolsos y verificación de derechos |
| iOS | Revisar las reglas de compras integradas para funciones digitales, las excepciones y las condiciones por región antes de diseñar botones, enlaces o desbloqueos externos |
| Android | Revisar Google Play Billing, excepciones y condiciones regionales para funciones digitales; no asumir que una compra web se pueda promover o restaurar de cualquier forma |
| Servicios físicos contratados a negocios | Tratar su contratación/pago como un dominio comercial distinto de la compra de una función digital de AutonoSuite |

Los precios 99 € y 39 € son provisionales. El prototipo no implementa cobros. No se define todavía un mecanismo real común de licencias entre web, iOS y Android: requiere lectura de las políticas vigentes, selección de canales y revisión de casos concretos.

Fuentes oficiales a revisar al diseñar el canal real: [Apple App Review Guidelines, compras integradas](https://developer.apple.com/app-store/review/guidelines/#in-app-purchase), [política de pagos de Google Play](https://support.google.com/googleplay/android-developer/answer/9858738) y [documentación de Google Play Billing](https://developer.android.com/google/play/billing). La lectura directa de las páginas de políticas comerciales de Apple y Google quedó bloqueada con 403 por la red de esta instancia. Por eso sus condiciones actuales no se consideran verificadas. Se consultaron fuentes técnicas oficiales de Expo mediante su repositorio público, detalladas en `MOVIL_Y_PRUEBAS.md`. Los enlaces de políticas no equivalen a aprobación de las tiendas ni a una revisión legal de la implementación.

## Arquitectura multiplataforma propuesta

```text
apps/
  web/                  # Next.js, App Router y UI web
  mobile/               # React Native + Expo para iOS y Android
packages/
  domain/               # Entidades, reglas y casos de uso sin DOM ni SDK de proveedor
  contracts/            # Tipos y contratos de API/eventos
  validation/           # Validadores compartidos y esquemas versionados
  catalog/              # Sectores, módulos, recomendaciones y compatibilidad
  permissions/          # Cálculo de capacidades; el servidor vuelve a verificarlo
  design-tokens/        # Color, tipografía, espacio y movimiento, sin imponer CSS a native
  storage/              # Puertos e interfaces; adaptadores por plataforma
  sync/                 # Protocolos/outbox, idempotencia y resolución de conflictos
```

Esta estructura es una propuesta de evolución. Hoy el código sigue bajo `src/`; no existe aún una aplicación Expo lista para Expo Go. La extracción se hará cuando exista un consumidor móvil verificable, conservando imports públicos y pruebas de las reglas.

| Función | Adaptador web | Adaptador móvil previsto |
| --- | --- | --- |
| Rutas | Next.js | Expo Router |
| Datos locales estructurados | IndexedDB, según evaluación | SQLite |
| Secretos/credenciales | Cookies seguras/flujo de sesión revisado | Almacenamiento seguro nativo |
| Archivos | File API y almacenamiento local elegido | File system y selectores nativos |
| Autenticación conectada | Adaptador Supabase para web, con servidor | Adaptador móvil y enlaces de retorno |
| Ubicación opcional | Geolocation API con consentimiento | Permisos y API nativa de ubicación |
| Notificaciones | Adaptador web cuando se habilite | Permisos y proveedor push revisado |

No se comparte directamente CSS, `next/link`, acceso a `window` o componentes DOM con React Native. Se comparten reglas, tipos, validaciones, contratos y tokens; cada plataforma conserva componentes accesibles adecuados.

## Evaluación local-first

### Datos y operaciones offline

Los casos locales elegibles incluyen clientes del contexto autorizado, proyectos, trabajos, borradores de presupuestos, agenda personal/local, documentos e informes básicos. La primera carga de esta web necesita el servidor: guardar en `localStorage` no garantiza arranque offline ni una PWA instalable.

Modelo propuesto para sincronización: IDs estables, `organization_id`, revisión, versión de esquema, fecha informativa de edición y tombstones de borrado. Los relojes del dispositivo no son una autoridad para resolver conflictos ni disponibilidad.

- Las escrituras locales pasan por un repositorio/adaptador y una outbox con identificador idempotente.
- La sincronización compara la revisión base y los permisos vigentes. Los reintentos no duplican pedidos o solicitudes.
- Cambios en campos independientes pueden combinarse si el dominio lo permite. Conflictos sobre el mismo campo o documento se muestran para revisión; no se aplica una regla global de «última escritura gana» a todo.
- Reservas, numeración fiscal, licencias y otras operaciones de autoridad requieren validación online de su dominio. Un borrador offline conserva estado pendiente; nunca confirma una reserva ni emite una factura real.
- Los adjuntos tienen manifiesto, tamaño y checksum, cuotas y reanudación. La subida no se considera terminada hasta su validación por el servicio.
- La revocación remota de membresías no puede conocerse instantáneamente sin conexión. Se definirá una política de caché, comprobación al reconectar y protección local proporcional al riesgo antes de prometer acceso offline a datos privados.

### Conflictos, copias y migraciones

| Área | Política a implementar y probar antes de producción |
| --- | --- |
| Conflictos | Revisión base, comparación por dominio, estado visible y elección explícita cuando no sea posible fusionar |
| Copias | Exportación consistente de datos/adjuntos con manifiesto, versión y checksum; cifrado y recuperación revisados para datos privados |
| Restauración | Validar integridad/esquema antes de importar; vista de resumen y recuperación comprobada en una copia |
| Migración | Incremental, transaccional cuando el motor lo permita, con copia previa y pruebas desde versiones soportadas |
| Compatibilidad | Conservar exportación y lectura de versiones compatibles; no prometer abrir esquemas nuevos desde clientes antiguos sin migrador |
| Borrado | Tombstones y plazos de retención; diferenciar borrado local, borrado sincronizado y copias retenidas por obligaciones aplicables |
| Cuotas | Medir límites del dispositivo, almacenamiento remoto y costes; comunicar errores sin pérdida silenciosa |

La licencia de una versión anterior no se revoca para forzar migraciones comerciales. Una incompatibilidad de esquema debe explicarse y ofrecer recuperación/exportación o una versión compatible; no destruir datos como respuesta a un conflicto de versión.

## Modelo demo existente y compatibilidad

- `src/lib/catalog.ts`: plantillas y módulos tipados; sus recomendaciones no otorgan acceso.
- `src/lib/demo.ts`: configuración local validada, Clientes obligatorio, sin cobros/facturación operativos.
- `src/features/business-profile/`: cuatro perfiles ficticios, catálogo compartido, fotos pequeñas y solicitudes de ejemplo.
- `src/features/messaging/`: hilos y archivos locales de demostración. Su existencia no garantiza entrega entre usuarios; las pruebas de esta revisión deben completar la verificación.
- Las rutas de empresa, Cliente y directorio son vistas de la misma web. La URL no verifica una identidad.

Las claves internas antiguas que empiezan por `nexo-demo-` se mantienen para no borrar la configuración y los favoritos existentes al cambiar la marca. No son nombres comerciales. Una futura migración de claves deberá leer las antiguas, validar, escribir la versión nueva y comprobar el resultado antes de retirar las anteriores.

Las fotos del perfil son contenido de presentación. Los adjuntos de chat representan entregas privadas y no se publican automáticamente en el perfil. El prototipo puede usar URLs de objeto durante la sesión; si se pierden los bytes al recargar debe mostrarlo y deshabilitar la descarga. Nada de esto garantiza confidencialidad de producción.

## Seguridad y verificaciones antes de conectar servicios

1. Modelar amenazas y límites por dominio, incluidos sectores regulados.
2. Probar servidor y RLS con dos empresas y dos usuarios, cambios de rol y archivos cruzados.
3. Verificar consentimiento para perfil público, zonas y datos precisos; la búsqueda por ciudad no requiere ubicación del cliente.
4. Probar concurrencia/idempotencia y zonas horarias en reservas y pedidos.
5. Probar migraciones, copias, restauración y eliminación.
6. Verificar licencias/recibos por canal y derechos de versiones anteriores antes de activar premium real.
7. Validar normativa española antes de facturación o una revisión fiscal automatizada; definir límites de cualquier orientación.

La aprobación visual del Hito 0 no sustituye estas pruebas ni autoriza automáticamente el siguiente hito.
