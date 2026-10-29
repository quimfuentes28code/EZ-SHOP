# Verificación de AutonoService

## Revisión de integración y privacidad — 29 de octubre de 2026

Base inspeccionada: `main`, commit `d424a9b`. Rama de correcciones: `codex/pulido-integracion`. El propietario autorizó las correcciones descritas en [PULIDO_20261029.md](PULIDO_20261029.md). Los resultados corresponden a esta rama; cada comprobación indica el entorno y sus límites.

| Comprobación de esta rama | Estado |
| --- | --- |
| Instalación desde el lockfile | `npm ci` correcto, sin añadir dependencias |
| `npm run typecheck` | Correcto |
| `npm test` | 65 pruebas correctas, 0 fallos y 0 omitidas |
| `npm run build` | Correcto: exportación de las 20 páginas; también se generó la compilación normal sin variables ficticias |
| Navegador (`verify:e2e` y regresión focalizada) | 42 casos comprobados: 40 generales y 2 de renovación de vídeo correctos en sus últimas ejecuciones; ninguna prueba omitida |
| `npm run test:sql` | 12 migraciones y 47 aserciones correctas en PostgreSQL 17.11 local desechable; véase [PRUEBAS_SQL.md](PRUEBAS_SQL.md) |
| Backend remoto del propietario | No modificado por esta revisión |
| Migración correctiva 0012 en backend remoto | No aplicada por esta revisión |
| Revisión responsive | Empresa y Cliente a 360, 768 y 1440 px, en claro/oscuro: sin desbordamiento ni errores de ejecución detectados |
| iPhone físico, TestFlight y Android nativo | No verificados por esta revisión |

En la auditoría previa se reejecutaron las **48 pruebas unitarias existentes** de `d424a9b` en una copia aislada. Su resultado no certifica las correcciones posteriores ni el backend conectado: cubren principalmente el dominio de demostración.

La ejecución completa de 42 casos pasó los 40 recorridos generales y detectó dos fallos en la fixture de vídeo: el transporte simulado no respondía a peticiones HTTP Range y no permitía buscar la posición inicial. Se corrigió para responder `206` con `Content-Range`/`Accept-Ranges`, se añadió una precondición de posición y se reejecutaron los dos casos: **2/2 correctos en 5,3 s**. No se eliminaron pruebas ni se rebajaron sus comprobaciones. Los otros 40 casos habían pasado sobre la misma compilación final.

## Ejecutar las comprobaciones web

```bash
npm ci
npm run typecheck
npm test
npm run verify:e2e
```

En PowerShell utiliza `npm.cmd`. `scripts/test.mjs` descubre las suites TypeScript sin depender de comodines del shell. `npm start` sirve la exportación estática `out/` mediante `scripts/serve-static.mjs`; `next start` no es compatible con `output: "export"`.

`npm run verify:e2e` genera la compilación con URL/clave ficticias y ejecuta Playwright con transporte interceptado. No cambia variables persistentes ni archivos `.env`. El puerto 3000 debe estar libre; el runner inicia su propio servidor estático y lo cierra al terminar. Después, ejecutar `npm run build` para generar la vista habitual con la configuración de desarrollo. `npm run test:e2e` ejecuta solo Playwright y necesita una compilación preparada con las mismas variables ficticias que usa CI. Usa `/usr/bin/chromium` si está instalado; puede indicarse otro ejecutable mediante `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. Si falta el navegador, ejecutar `npx playwright install chromium` (`npx.cmd` en PowerShell). Evita reutilizar un servidor de otra rama o una compilación anterior. Los artefactos de fallos se guardan en `test-results/`, ignorado por Git.

## Alcance de las pruebas actuales

- Las demos deben completar onboarding, cambio de experiencia, perfil/catálogo, actividad y mensajes dentro de sus rutas de demostración, sin enviar sus datos a Supabase.
- Los escenarios conectados de navegador usan **respuestas Supabase simuladas**, sesiones ficticias y peticiones interceptadas. Permiten comprobar la UI, sus estados, navegación y solicitudes emitidas sin utilizar cuentas del propietario.
- Las pruebas de chat deben cubrir selección estable con refresco, últimos mensajes e historial, borradores por conversación, lectura de lo mostrado y separación Empresa/Cliente.
- Los medios deben respetar referencias propias, firmas temporales, borradores, publicación/retirada, compensación ante fallos y disponibilidad de la migración correctiva.
- Las preferencias de módulos deben permanecer en su organización y distinguir el borrador de la selección guardada.
- Las pruebas SQL locales deben validar las políticas y permisos con identidades distintas y datos ficticios. Un esquema local que reproduce las tablas necesarias no certifica todos los componentes del servicio Supabase alojado.
- CI debe comprobar TypeScript, unitarias, exportación y recorridos de navegador. Un resultado verde no sustituye pruebas autenticadas sobre un proyecto de desarrollo autorizado.

## Revisión manual pendiente del entorno conectado

Con datos ficticios y un proyecto de desarrollo autorizado, comprobar confirmación de correo y retornos, acceso y activación de ambas experiencias, persistencia entre dispositivos, solicitudes, chat bidireccional, archivos y publicación/retirada de medios. Intentar leer y modificar organizaciones, conversaciones y archivos ajenos. Verificar la versión de migraciones aplicada y los permisos de Storage.

La nueva migración cambia el bucket histórico de medios a privado. Debe coordinarse con la versión del frontend que resuelve los archivos mediante firmas. Los enlaces emitidos por esta app usan 60 segundos; esto no recupera descargas ni cachés anteriores ni impide que otros clientes autorizados soliciten al proveedor otro tiempo de firma. Las referencias externas HTTPS conservadas no pueden retirarse mediante nuestras políticas de Storage.

## Evidencia histórica del Hito 0 — `e4713e5`

La revisión histórica registró `npm ci`, TypeScript y build correctos, **48 unitarias y 27 E2E correctas**, sin omitidas. Aquellos E2E verificaban las rutas demo antes de trasladarlas a `/demo/*`; sus resultados no prueban la implementación conectada posterior de `main` ni la rama actual.

Las capturas anteriores de `docs/previews/` pertenecen a esa revisión histórica. Las nuevas `pulido-*.png` muestran esta revisión con datos sintéticos y transporte interceptado. Sirven de antecedente visual; no acreditan el estado actual, un despliegue público o una prueba física de iPhone.

La primera base anterior registró 12 unitarias y 12 E2E. Se conserva como antecedente, sin trasladar automáticamente su resultado a revisiones posteriores.

## Móvil y límites

[MOVIL_Y_PRUEBAS.md](MOVIL_Y_PRUEBAS.md) explica la prueba web por red local y el camino nativo futuro. Un viewport de Chromium no acredita Safari real ni React Native. Ubicación automática, push, compras, licencias, fiscalidad operativa, concurrencia de reservas, sincronización offline y publicación en tiendas requieren implementación y validaciones específicas.
