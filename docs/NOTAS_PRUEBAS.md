# Verificación de AutonoService — Hito 0

## Revisión actual: especificación maestra

Están implementados la marca, entrada, onboarding de dos experiencias, selector, Mi plan y los recorridos locales de perfil, catálogo, conversación y solicitudes. **Verificación final completada: 27 pruebas de navegador correctas.**

| Comprobación de la revisión actual | Estado registrado |
| --- | --- |
| Instalación desde el lockfile | `npm ci` correcto |
| `npm run typecheck` | Correcto |
| `npm test` | 48 pruebas unitarias correctas |
| `npm run build` | Compilación correcta de todas las rutas |
| `npm run test:e2e` | 27 pruebas correctas contra `npm start`, 0 fallos y 0 omitidas (2,7 min) |
| iPhone físico | No verificado en esta entrega por el agente |
| Aprobación visual del propietario | Pendiente |

La evidencia anterior corresponde a esta revisión, salvo donde se indica el antecedente histórico. Las pruebas se ejecutaron contra la compilación de producción sin sesiones de capturas simultáneas; verifican los recorridos de esta revisión, no garantías de seguridad de producción.

## Ejecutar

Desde la carpeta que contiene el lockfile:

```bash
npm ci
npm run typecheck
npm test
npm run build
npm run test:e2e
```

En Windows/PowerShell utiliza `npm.cmd` para evitar el bloqueo de `npm.ps1`. `scripts/test.mjs` descubre `*.test.ts` de `tests/unit/` sin depender de la expansión de comodines del shell y conserva el resultado de cada suite.

Playwright reutiliza un servidor en el puerto 3000 o inicia uno. Usa `/usr/bin/chromium` cuando existe; puede indicarse otro ejecutable con `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. Si falta el navegador, ejecutar `npx playwright install chromium` (`npx.cmd` en PowerShell). Los resultados de fallos en `test-results/` son artefactos locales ignorados por Git.

Se han renovado capturas del prototipo compilado en `docs/previews/`: entrada oscura/clara, Mi negocio, móvil, Cliente, Mi plan, perfil del negocio y mensajes. Son evidencia visual, no sustituyen la ejecución de los recorridos.

## Casos que deben validar la revisión

### Marca y primera entrada

- Marca AutonoService y los eslóganes correctos; Cliente como experiencia, AutonoSuite sólo como mejora profesional.
- Entrada con la pregunta y las dos opciones exactas, sin inventar dos cuentas o productos independientes.
- Onboarding de ambas experiencias, validación y errores de almacenamiento visibles.
- Selector Mi negocio/Modo cliente y elección de empresa demo, con recuerdo tras recargar y posibilidad de cambiar.
- Mi plan sin solicitud de tarjeta, checkout, recibo o licencia real; Cliente nunca requiere premium.
- Derechos profesionales por capacidad/versión: no tratar un booleano editable como permiso de producción.

### Interacción conservada

- Cuatro sectores en onboarding y navegación de herramientas activas; Clientes obligatorio y finanzas no operativas.
- Edición de perfil/catálogo desde negocio y consulta de los mismos datos desde Cliente/directorio.
- Creación de elementos y adjuntos sin `crypto.randomUUID`, simulando la ausencia de esa API en HTTP local; no equivale a una prueba física en Safari.
- Búsqueda, filtros, favoritos, preferencias y estados vacíos.
- Solicitud de reserva local con fecha/hora válidas, sin POST a un negocio, confirmación o plaza bloqueada.
- Mi actividad identifica cada solicitud como ejemplo no enviado y no mezcla reglas de cita y pedido.
- Conversaciones locales separadas por hilo; cambio de perspectiva no simula entrega a otra persona.
- Adjuntos de prueba, límites/tipos, descarga durante la sesión y aviso de archivo no disponible tras recarga.
- Fotos de perfil separadas de adjuntos privados.

### UI, datos y accesibilidad

- Rutas antiguas y nuevas a 360, 768 y 1440 px sin desbordamiento horizontal involuntario.
- Navegación por teclado, nombres accesibles, foco visible, Escape y restitución de foco en modales/menú móvil.
- Temas claro/oscuro y contraste legible en componentes y estados.
- Cero errores de ejecución/hidratación; inspeccionar tanto `pageerror` como `console.error` cuando proceda.
- Datos corruptos, claves heredadas, duplicados, bloqueo de almacenamiento, cuotas y recuperación sin fingir guardado.
- Compatibilidad de las claves antiguas y ausencia de borrado silencioso al cambiar de marca.

## Pruebas móviles

La guía [MOVIL_Y_PRUEBAS.md](MOVIL_Y_PRUEBAS.md) explica la revisión web en Safari/Chrome y el futuro camino nativo. El viewport de Chromium emula un tamaño, no demuestra el comportamiento de un iPhone real o de una app React Native.

Para el iPhone físico revisar red local, controles táctiles, teclado, selección de archivos y persistencia de Safari. No dar por comprobadas ubicación, push, autenticación nativa, Expo Go, compras de tienda o distribución sin una implementación y un dispositivo/build adecuados.

## Antecedente de la primera versión

En la primera versión se comprobaron instalación, reinstalación con `npm ci`, TypeScript, 12 unitarias, compilación y 12 E2E en 50,6 s contra `npm start`, sin fallos ni omitidas. Las cinco rutas originales se revisaron a 360, 768 y 1440 px sin errores JavaScript detectados. Esa evidencia corresponde a una revisión anterior y no certifica los cambios actuales.

## Fuera del alcance de validación del Hito 0

Autorización multiempresa, RLS, aislamiento de archivos de producción, concurrencia de reservas reales, fiscalidad española operativa, pagos/licencias verificadas, sincronización, migraciones de una base productiva y publicación en App Store/Google Play. No hay backend o apps nativas que permitan declarar esas garantías. Deben probarse en sus hitos.
