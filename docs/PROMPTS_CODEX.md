# Prompts de trabajo de AutonoService

La referencia de producto es `docs/ESPECIFICACION_MAESTRA.md`; el estado de código se registra en `README.md`, `ARQUITECTURA.md` y `PULIDO_20261029.md`. El propietario exige permiso antes de modificar el proyecto. La aprobación de esta revisión cubre las correcciones acordadas; estas plantillas no conceden por sí solas autorización para ampliaciones.

## Revisión autorizada de integración

```text
Lee AGENTS.md, README.md y los documentos de docs/. Comprueba la rama y los cambios pendientes antes de editar. Trabaja desde main en la rama de revisión acordada y conserva el trabajo local de otras ramas.

Corrige los problemas auditados de permisos y privacidad de medios, mensajes, separación de contextos, navegación demo/real, búsqueda por sedes, preferencias de herramientas y accesibilidad. Conserva las funciones conectadas incorporadas por el propietario, las demostraciones históricas y la identidad AutonoService/Cliente bajo una misma cuenta. AutonoSuite sigue siendo una mejora prevista sin compras activadas.

Prepara migraciones incrementales sin aplicarlas al backend del propietario. Usa cuentas y datos ficticios o respuestas simuladas para las pruebas automáticas. Documenta límites de enlaces firmados, datos históricos y qué validaciones cubren las pruebas SQL locales frente al servicio alojado.

Ejecuta instalación desde el lockfile, typecheck, unitarias, exportación estática y E2E pertinentes. Actualiza las instrucciones de arranque y revisión en iPhone, diferenciando web responsive de Expo/TestFlight futuros. Registra resultados por revisión y entrega cambios revisables. No despliegues ni amplíes la fase sin la autorización correspondiente.
```

## Antes de una ampliación posterior

```text
Inspecciona qué está implementado en main y sus dependencias. Describe el problema, alcance y comprobaciones de la ampliación para obtener la autorización del propietario antes de modificar el proyecto.

Conserva una identidad global, los permisos contextuales de organizaciones y la separación del historial personal de Cliente. No confíes en organization_id, rol, experiencia o licencias enviados por el navegador. Reutiliza componentes, contratos y validaciones compatibles con web y móvil sin duplicar aplicaciones por sector.

Las reservas requieren reglas de disponibilidad y concurrencia; los documentos fiscales requieren revisión normativa; pagos y licencias requieren revisión por plataforma. No conviertas registros internos o prototipos visuales en capacidades operativas sin implementar y validar sus reglas.
```

## Antecedentes

Los encargos originales de Hito 0 y de la primera integración de Supabase están documentados en `HITO_0.md` y `HITO_1_CUENTAS_Y_CRM.md`. Sus restricciones y listas de funciones pendientes corresponden a esas entregas históricas; no ordenan retirar capacidades que el propietario ya incorporó después. El roadmap conserva los objetivos de producto sin certificar que cada hito esté completo.
