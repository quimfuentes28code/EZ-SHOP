# Hito 0 — Implementación para revisión visual

## Objetivo y estado

Preparar una base navegable de Nexo con Next.js App Router, TypeScript estricto y componentes reutilizables. El resultado permite revisar visualmente las experiencias de empresa y cliente antes de conectar servicios reales. El Hito 1 no está iniciado y requiere aprobación explícita del propietario.

La compilación de producción, TypeScript y 12 pruebas unitarias se han verificado en esta instancia. Las 12 pruebas de navegador finalizaron correctamente contra la compilación de producción, sin fallos ni pruebas omitidas; el alcance se registra en `NOTAS_PRUEBAS.md`. También se revisaron capturas de móvil y escritorio. El prototipo está preparado para revisión; la aprobación de diseño queda pendiente del propietario.

## Experiencias incluidas

| Ruta | Implementación de demostración |
| --- | --- |
| `/` | Presentación del producto, propuesta modular y acceso a las dos experiencias |
| `/onboarding` | Flujo guiado de actividad, modalidad, módulos, identidad y resumen antes de entrar al panel |
| `/empresa` | Resumen de actividad ficticia, navegación según módulos, buscador, personalización y vistas de ejemplo |
| `/cliente` | Cuenta personal de muestra independiente del panel de negocio, actividad, favoritos y preferencias locales |
| `/explorar` | Directorio de cuatro ejemplos, búsquedas y filtros; mapa futuro sin pines ni direcciones |

Diseño oscuro con acentos lima, jerarquía visual, estados vacíos, mensajes de almacenamiento, navegación móvil y foco visible. Los componentes compartidos incluyen marca, cabecera, selector de módulos, modal y vistas de módulo.

## Decisiones de arquitectura

- **Composición por capacidades.** `src/lib/catalog.ts` define 28 plantillas sectoriales y 25 módulos con identificadores estables. Una plantilla recomienda una combinación; no crea otra aplicación. Los dominios de cita, capacidad, encargo, proyecto o alquiler se mantienen diferenciados.
- **Estado de las capacidades.** 23 módulos disponen de vista `preview`; Cobros y Facturación permanecen `planned` y deshabilitados. Las vistas presentan ejemplos, no procesos comerciales completos. Clientes es obligatorio en cualquier configuración.
- **Datos locales no fiables.** `src/lib/demo.ts` normaliza carga y guardado en `nexo-demo-business-v1`: descarta módulos desconocidos o planificados, deduplica, mantiene el núcleo y recupera una configuración de muestra ante JSON inválido o almacenamiento bloqueado.
- **Persistencia limitada.** Empresa, favoritos y preferencias se guardan sólo en `localStorage`. No existe sincronización entre dispositivos ni sesión real. Los mensajes de error distinguen un guardado fallido de uno correcto.
- **Visibilidad pública.** Desactivada por defecto. Una preferencia local no publica el negocio y no alimenta el directorio, que conserva sus ejemplos fijos.
- **Acceso y privacidad futuros.** El catálogo modular y la ocultación de menús no proporcionan autorización. Servidor, membresías verificadas y RLS pertenecen a una fase posterior. La propuesta de `ARQUITECTURA.md` no describe controles ya implementados.
- **Dependencias acotadas.** Next.js y React soportan las vistas; Lucide aporta iconos reutilizables. `tsx` ejecuta las pruebas TypeScript con el runner de Node y Playwright verifica recorridos reales en navegador. No se conectan proveedores comerciales.
- **Entorno de desarrollo reproducible.** `typecheck` ejecuta `next typegen` antes de TypeScript. `next.config.ts` admite el origen de desarrollo local `127.0.0.1` utilizado por Playwright y desactiva la generación automática de reglas de agente para conservar `AGENTS.md`.

## Vista previa y configuración del entorno

El servidor se inicia con `npm run dev -- --hostname 0.0.0.0` en el puerto 3000; para comprobar la salida compilada, utiliza `npm run build` y después `npm run start -- --hostname 0.0.0.0`. Las capturas de `docs/previews/` permiten revisar empresa, móvil, cliente e inicio; no implican hosting público.

Se han guardado instrucciones de instalación y arranque en el borrador de configuración del entorno en la nube. El borrador no equivale a una configuración publicada: el propietario debe revisarlo y guardarlo en los ajustes del entorno, y después publicar el entorno. La publicación y la restauración en una tarea nueva no se han verificado en esta entrega.

## Límites deliberados

No hay autenticación real, creación de cuentas, base de datos de producción, reservas enviadas, facturas, cobros, correos, mapa ni datos de clientes reales. Todos los negocios, métricas, contactos y actividades de ejemplo son ficticios. Los sectores regulados muestran advertencias y no incluyen expedientes clínicos o financieros operativos.

Esta fase verifica la interfaz y el flujo de configuración; no certifica aislamiento multiempresa, seguridad de producción, cumplimiento regulatorio ni operación comercial.

## Backlog priorizado, fuera de esta entrega

1. **Revisión visual y aprobación del Hito 0.** Recoger cambios de diseño y seleccionar el primer sector piloto.
2. **Hito 1, sólo tras aprobación.** Identidad global, organizaciones, membresías, roles y persistencia real de módulos. Diseñar y probar permisos de servidor y RLS, incluyendo intentos de acceso cruzado entre empresas, antes de conectar operaciones reales.
3. **Hito 2.** CRM mínimo y servicios; después motor de reservas con recursos, horarios, zona horaria, concurrencia y cancelaciones. No extender indiscriminadamente la lógica de citas a otros dominios.
4. **Hitos posteriores.** Presupuestos/proyectos, vinculación verificada de la cuenta cliente y validación de composición con Peluquería y Pastelería, siguiendo `ROADMAP.md`.
5. **Fases posteriores de descubrimiento y comercialización.** Consentimiento de perfiles públicos, directorio real, mapas y pagos sólo cuando existan requisitos y revisión específica.

No se avanza automáticamente a ninguno de estos puntos por terminar las pruebas del prototipo.
