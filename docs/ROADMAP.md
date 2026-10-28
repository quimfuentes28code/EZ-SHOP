# Roadmap progresivo y condiciones de aceptación

## Hito 0 — Prototipo navegable para revisión visual
- [x] Proyecto web Next.js + TypeScript, estilos y rutas principales.
- [x] Onboarding: escoger sector, modalidad, módulos y nombre.
- [x] Catálogo inicial de sectores y módulos.
- [x] Panel de negocio condicionado por módulos.
- [x] Panel de cliente con actividad de muestra.
- [x] Directorio de muestra; placeholder explícito de mapa futuro.
- [x] Instalar dependencias y verificar TypeScript y compilación de producción.
- [x] Rediseñar landing, onboarding, panel empresa, cuenta cliente y directorio con componentes reutilizables.
- [x] Validar el catálogo y la persistencia local mediante 12 pruebas unitarias.
- [x] Ejecutar 12 pruebas de navegador correctas para cuatro sectores, navegación, persistencia, menú móvil y vistas a 360, 768 y 1440 px.
- [x] Revisar capturas responsive en móvil y escritorio; consultar `NOTAS_PRUEBAS.md`.
- [ ] Revisar y aprobar el diseño con el propietario.

**Salida verificable**: interfaz navegable en localhost, sin errores de compilación, datos claramente ficticios.

Las vistas de módulos son demostraciones, no dominios operativos completos. Cobros y Facturación están deshabilitados; Clientes siempre forma parte del núcleo. Consulta `HITO_0.md` para decisiones y limitaciones.

## Hito 1 — Autenticación y multiempresa
**No iniciado. Requiere aprobación explícita del propietario tras revisar el Hito 0.**

- Registro/login, sesiones robustas, perfil único.
- Creación de empresa real y membresías/roles (propietario, administrador, empleado).
- Módulos por organización, perfiles públicos desactivados por defecto.
- RLS y pruebas cruzadas: usuario A no ve los datos de B.
- Selector entre varias organizaciones por usuario.

**Salida verificable**: dos empresas reales de prueba con cero fugas de datos en endpoints y base de datos.

## Hito 2 — Motor de citas + CRM mínimo
- Clientes por empresa con vinculación segura a cuenta global (opt-in/verificación).
- Servicios, horarios, sede/recurso, bloqueos y cancelaciones.
- Reservas por enlace, incluso modo invitado, y prevención de solapes.
- Zona horaria, cambios de horario estacionales, notificaciones.

**Salida verificable**: reservas reales sin doble asignación simultánea y con permisos correctos.

## Hito 3 — Presupuestos y trabajos
- Solicitudes, presupuestos versionados, aceptación, proyectos, estados y entregables básicos.
- Perfil piloto fotografía/vídeo completo: de solicitud a trabajo entregado.

**Salida verificable**: flujo comercial real de un fotógrafo piloto, sin procesar pagos en plataforma.

## Hito 4 — Cuenta unificada del cliente
- Reservas y encargos de negocios distintos, solo cuando se ha vinculado y verificado cada relación.
- Cancelaciones/solicitudes según política del negocio.
- Invitaciones, privacidad y derechos de acceso.

**Salida verificable**: cuenta cliente consulta dos negocios sin permitir acceso cruzado entre empresas.

## Hito 5 — Prueba real de módulos cruzados
- Peluquería con agenda y empleados.
- Pastelería con pedidos y recogidas.
- Identificar qué funciones son núcleo y cuáles requieren lógicas especializadas.

**Salida verificable**: añadir estos sectores sin clonar el CRM ni el módulo de usuarios.

## Hito 6 — Directorio público
- Consentimiento del negocio; perfil público, categorías y búsqueda textual/geográfica por ciudad.
- Moderación, estados de disponibilidad y tratamiento responsable de reseñas (si se incorpora).

**Salida verificable**: solo aparecen negocios con visibilidad activa y perfil suficientemente completo.

## Hito 7 — Mapa e integración comercial
- Mapa interactivo con datos verificados de ubicación/zonas.
- Costes y límites de proveedores de mapa, geocodificación, spam y rate limits.
- Suscripciones B2B y potenciales comisiones, contratos y fiscalidad, según demanda.

**Salida verificable**: negocios reales suficientes en una región piloto para justificar el mapa.

## Regla de inversión de esfuerzo
No desarrollar todos los sectores simultáneamente. En cada hito: demo funcional -> pruebas -> piloto -> decisión de continuar.
