# Instrucciones persistentes para Codex: AutonoService

## Referencia principal

Lee `README.md`, `docs/ESPECIFICACION_MAESTRA.md` y todos los documentos de `docs/` antes de desarrollar. El estado de integración actual está en `docs/PULIDO_20261029.md`; los documentos de Hito 0 y decisiones sustituidas se conservan como antecedentes, no como descripción de todas las rutas actuales. La especificación maestra aportada por el propietario sustituye las decisiones de marca, alcance y roadmap anteriores que entren en conflicto con ella.

AutonoService — **Tu negocio. Más fácil.** — es una única aplicación con experiencia profesional y experiencia **Cliente**, gratuita. **AutonoSuite** — **Todo el potencial de tu negocio.** — es una mejora premium de gestión dentro de la misma aplicación, sin otra cuenta ni instalación. No se utilizarán nombres comerciales que añadan Business a la marca ni presenten Cliente como producto independiente. Los nombres internos descriptivos y las claves heredadas de almacenamiento pueden conservarse por compatibilidad.

## Reglas obligatorias

1. NO construir una aplicación distinta por sector. Reutilizar módulos y composiciones; los sectores son plantillas de configuración, con adaptadores especializados sólo cuando las reglas lo justifiquen.
2. NO asumir que todo negocio funciona mediante citas: contemplar reservas de capacidad, encargos, presupuestos, proyectos, ventas, alquileres, alojamientos y otras operaciones.
3. NO construir un megaformulario o tabla `transactions` con lógica indiscriminada para todos los tipos de operación. Cada dominio conserva entidades y reglas propias y puede compartir contratos/eventos.
4. Diseñar una identidad global de persona, organizaciones, membresías, sedes, sectores, módulos, configuración por empresa y relaciones verificadas de cliente. Una persona puede ser profesional, empleada y cliente de diferentes negocios simultáneamente.
5. Separación estricta por organización: roles y permisos verificados EN SERVIDOR y con Row Level Security en producción. Ocultar botones no basta. Nunca confiar en `organization_id`, perspectiva o rol enviado por el cliente sin comprobar acceso.
6. Una identidad global de Cliente NO concede a todas las empresas visibilidad de su historial. Cada empresa accede exclusivamente a relaciones y datos autorizados en su contexto. Los archivos privados requieren participantes y propiedad comprobados.
7. Salud, finanzas y otros dominios regulados requieren evaluación específica; no crear módulos clínicos, fiscales o financieros operativos por defecto. La facturación real exige normativa española aplicable y la orientación fiscal debe definir sus límites.
8. Separar perfil/fotos públicas de datos internos y adjuntos privados. Ubicación, cobertura y visibilidad pública requieren consentimiento y control explícito; el cliente debe poder buscar por ciudad sin compartir ubicación precisa.
9. Mantener las demostraciones del Hito 0 con datos ficticios y avisos claros. Las rutas `/empresa` y `/cliente` ya usan Supabase; las demos están en `/demo/*`, `/explorar`, `/negocio/*` y `/mensajes`. No mezclar sus datos ni enviar una operación demo al backend. Los selectores y el almacenamiento local no conceden autorización. No introducir pagos ni facturación real en esta revisión.
10. TypeScript estricto, componentes accesibles y responsive, temas claro/oscuro y separación entre dominio, UI y adaptadores. No incluir secretos en el repositorio. Evitar dependencias de DOM/Next.js en reglas destinadas a compartirse con React Native.
11. Antes de introducir dependencias, consultar documentación reciente y explicar por qué se necesitan. Preferir las herramientas existentes y el lockfile.
12. Ejecutar instalación apropiada al lockfile (`npm ci` o `npm install` cuando se actualice), `npm run typecheck`, `npm test` y `npm run build`; usar las E2E relevantes cuando se modifiquen recorridos. Corregir errores y distinguir pruebas pasadas, fallidas y no ejecutadas.
13. No avanzar a un hito posterior sin revisión humana explícita. Registrar decisiones y cambios en `docs/`; no sobrescribir funciones existentes sin revisar sus dependencias.
14. AutonoSuite es una mejora profesional de precio provisional, no una segunda aplicación ni premium de Cliente. Diseñar derechos por versión/canal; una licencia perpetua no promete infraestructura online ilimitada. No implementar compras reales antes de revisar políticas vigentes de cada plataforma.
15. Evaluar local-first con políticas explícitas de conflictos, copias, migraciones y servicios online. No describir la demo de `localStorage` como una solución offline completa o sincronizada.

## Encargo actual

El propietario ha autorizado corregir los problemas de integración, privacidad, navegación, pruebas y documentación detectados en `main`, conservando las funcionalidades conectadas ya existentes. Trabajar en `codex/pulido-integracion`, sin sobrescribir cambios locales de otras ramas. Preparar migraciones correctivas incrementales y pruebas; no aplicar SQL al backend ni desplegar como parte de esta revisión.

El propietario exige permiso antes de modificar el proyecto. La aprobación actual cubre las correcciones revisadas y su validación; los cambios de alcance o las fases nuevas requieren su autorización. Las instrucciones históricas de no conectar Supabase no ordenan eliminar la implementación que el propietario ha incorporado a `main`. Mantener AutonoService/Cliente bajo la misma identidad y AutonoSuite como mejora prevista, sin activar compras o nuevas capacidades empresariales.
