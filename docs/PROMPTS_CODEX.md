# Prompts de trabajo de AutonoService

La referencia principal es `docs/ESPECIFICACION_MAESTRA.md`. Las instrucciones del propietario prevalecen sobre estas plantillas; cada hito requiere la aprobación prevista en `AGENTS.md` y `ROADMAP.md`.

## Revisión del Hito 0

```text
Lee AGENTS.md, README.md y todos los documentos de docs/. Inspecciona las funciones existentes antes de cambiar su arquitectura o sustituirlas.

Actualiza el prototipo según la especificación maestra: AutonoService como marca principal, Cliente como experiencia gratuita de la misma aplicación y AutonoSuite como mejora premium profesional. Diseña la primera entrada con las dos opciones, onboarding profesional y personal, selector Mi negocio/Modo cliente, paneles y Mi plan. Mantén las interacciones de perfiles, catálogo, mensajes y solicitudes de demostración.

No implementes autenticación real, compras, marketplace completo, facturación real ni todas las capacidades del catálogo. No describas los menús locales como permisos de producción. Documenta identidad global, roles contextuales, módulos, estrategia local-first y arquitectura web/iOS/Android. Explica cómo probar la web en iPhone y distingue ese recorrido de Expo Go, Development Builds y TestFlight futuros.

Instala las dependencias apropiadamente al lockfile y ejecuta typecheck, unitarias, build y E2E relevantes. Registra lo que pasó, falló o quedó sin ejecutar. Termina con los cambios, límites y pasos para revisar. No avances al Hito 1 sin aprobación.
```

## Hito 1 — Sólo después de aprobación explícita

```text
Inicia el Hito 1 de ROADMAP.md: una identidad global, perfiles, organizaciones, sedes, membresías, roles, sectores y configuración de módulos. Diseña primero permisos de servidor y RLS, vínculos verificados con contactos y acceso a archivos privados.

No confíes en organization_id, perspectiva o rol enviados por el navegador. Escribe pruebas con varias personas y empresas para impedir lecturas, cambios y descargas cruzadas y elevación de privilegios. Mantén Cliente gratuito y el cálculo de derechos premium separado de permisos y habilitación de módulos. No conectes todos los dominios empresariales ni pagos por terminar autenticación.
```

## Hito 2 — Sólo tras revisión del núcleo

```text
Desarrolla las herramientas básicas autorizadas: CRM, agenda local, trabajos, proyectos sencillos y presupuestos básicos. Usa los permisos del núcleo y adaptadores de persistencia con contratos compartibles con móvil. Define los datos offline, exportación, copias y migraciones de lo implementado.

No conviertas borradores locales en reservas confirmadas ni documentos fiscales reales. Ejecuta las pruebas de dominio, aislamiento y recuperación pertinentes. Detente al cumplir el alcance revisable de este hito.
```

## Hitos posteriores

Utiliza la numeración y dependencias actuales de `ROADMAP.md`: reservas y conexión con clientes (3), sectores especializados (4), directorio (5), mapa (6), AutonoSuite y monetización (7), expansión (8). Las pantallas de demostración del Hito 0 no autorizan activar sus servicios reales.
