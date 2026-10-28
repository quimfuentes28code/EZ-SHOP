# Instrucciones persistentes para Codex: Nexo (nombre provisional)

## Visión
Una plataforma multiempresa con módulos reutilizables para muchos sectores y una identidad global de cliente. Cada negocio recibe un panel privado, puede configurar sus módulos y, en fases futuras, aparecer en un directorio de descubrimiento.

## Reglas obligatorias
1. NO construir una aplicación distinta por cada sector. Reutilizar módulos y composiciones; los sectores son plantillas de configuración.
2. NO asumir que todo negocio funciona mediante citas: contemplar citas, reservas con capacidad, encargos, presupuestos, proyectos, ventas, alquileres, alojamientos y otros tipos de operación.
3. NO construir un megaformulario o tabla `transactions` con lógica indiscriminada para todos los tipos de operación. Cada dominio podrá contar con tablas y reglas propias y eventos compartidos.
4. Modelar en el futuro `user`, `organization`, `membership`, `branch`, `sector`, `module`, `organization_module`, `customer_relationship` y entidades operativas específicas. Un usuario puede pertenecer a múltiples negocios y ser cliente en otros.
5. Separación estricta por organización: roles y permisos verificados EN SERVIDOR y con Row Level Security en base de datos. Ocultar botones no basta. Nunca confiar en `organization_id` enviado por el cliente sin verificar permisos.
6. Un cliente global NO concede a todas las empresas visibilidad de su historial. Cada empresa accede exclusivamente a relaciones y datos autorizados en su contexto.
7. Los flujos regulados (salud, finanzas, etc.) requieren una revisión específica; no crear módulos clínicos ni financieros operativos por defecto.
8. Diferenciar el perfil público de negocio de los datos internos. Las ubicaciones y la visibilidad pública requieren consentimiento y control explícito.
9. Para el Hito 0: UI demo con datos ficticios, sin autenticación real, sin cobros, sin reservas enviadas y sin datos sensibles. Etiquetar claramente toda simulación.
10. Código TypeScript estricto, componentes accesibles, responsive, con separación de dominio / UI / acceso a datos. Nada de secretos en el repositorio.
11. Antes de introducir dependencias, consultar documentación reciente y explicar por qué se necesitan.
12. Ejecutar `npm install`, `npm run typecheck`, `npm run build` donde el entorno lo permita y corregir errores antes de declarar el hito terminado.
13. No avanzar a un hito posterior sin revisión humana explícita. Registrar decisiones y cambios en `docs/`.

## Primer encargo
Revisar y perfeccionar las pantallas existentes (landing, onboarding, panel negocio, panel cliente y directorio demo), asegurar que compilan, y proponer backlog priorizado. No conectar Supabase todavía ni inventar datos reales.
