# Verificación del Hito 0

## Registro de esta implementación

| Comprobación | Resultado registrado |
| --- | --- |
| Dependencias | `npm install` inicial y reinstalación reproducible con `npm ci` correctas |
| `npm run typecheck` | Correcto |
| `npm test` | 12 pruebas unitarias correctas |
| `npm run build` | Compilación de producción correcta |
| `npm run test:e2e` | 12 pruebas correctas en 50,6 s contra la compilación de producción (`npm start`); 0 fallos y 0 omitidas |
| Aprobación visual del propietario | Pendiente |

La suite comprobó las cinco rutas a 360, 768 y 1440 px sin errores JavaScript ni mensajes `console.error`. Se revisaron también capturas de las cinco rutas en móvil y escritorio; `docs/previews/` conserva una selección para revisión del propietario. Tras reinstalar con `npm ci`, se repitieron correctamente TypeScript, las 12 unitarias y la compilación. Las comprobaciones de adaptación y foco de esta suite no equivalen a una auditoría completa de accesibilidad ni prueban seguridad de producción.

## Pruebas automatizadas

Desde la raíz del repositorio:

```bash
npm ci
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Las pruebas unitarias (`tests/unit/`) comprueban:

- Identificadores y composición del catálogo: 28 sectores y 25 módulos.
- Clientes obligatorio; Cobros y Facturación excluidos de módulos activables.
- Normalización de campos, claves heredadas, valores corruptos y duplicados.
- Lectura sin `window`, almacenamiento bloqueado y guardado en clave local versionada.

Las 12 pruebas de Playwright (`tests/e2e/hito-0.spec.ts`) comprueban:

- Onboarding de Fotografía, Peluquería, Panadería y Otro/Mixto, modalidad online y persistencia al recargar.
- Desactivar y activar Proyectos, con navegación empresarial acorde.
- Validación de nombre vacío y error visible cuando no se puede guardar.
- Cuenta cliente: detalles de muestra, pestañas por teclado y preferencia local de recordatorios.
- Directorio: filtros, estado vacío, restablecer filtros y mapa sin pines ni direcciones.
- Las cinco rutas a 360, 768 y 1440 px, sin desbordamiento horizontal ni errores JavaScript detectados, con foco visible al tabular.
- Menú móvil de empresa: apertura, recorrido de foco y cierre mediante Escape.

Playwright usa Chromium en `/usr/bin/chromium` si existe. Para otro ejecutable, define `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. Si no hay navegador instalado, ejecuta `npx playwright install chromium`. El servidor de pruebas se inicia automáticamente en el puerto 3000 o se reutiliza si ya está disponible. Los artefactos de fallo se generan en `test-results/`; no se deben subir al repositorio.

## Recorrido manual de revisión

1. Abrir `/` y seguir los accesos a onboarding, empresa, cliente y explorar.
2. En `/onboarding`, buscar Fotografía, Peluquería, Panadería y Otro/Mixto. Revisar las modalidades local, domicilio, online y mixta, la selección de módulos y el resumen.
3. Comprobar que Clientes no se puede desactivar y que Cobros y Facturación figuran como próximas capacidades.
4. Completar nombre y ciudad; abrir `/empresa`, recargar y verificar persistencia sólo en ese navegador. No introducir datos reales.
5. Personalizar módulos y comprobar que el menú cambia. Revisar búsquedas, vistas de muestra, selector de periodo y ayuda.
6. En `/cliente`, revisar actividad, favoritos y preferencias; confirmar que no se envía ningún mensaje, reserva o pago.
7. En `/explorar`, combinar búsquedas y filtros, provocar un estado vacío, restablecerlos y abrir Mapa futuro. No debe haber ubicaciones reales ni pines ficticios.
8. Revisar móvil, tableta y escritorio (360, 768 y 1440 px), recorrido con teclado, foco, etiquetas, legibilidad y contenido de modales.
9. Confirmar que toda actividad está identificada como ficticia y que no se ha conectado autenticación, Supabase, mapas ni pagos.

La revisión visual y la aprobación del propietario son necesarias para decidir el siguiente hito. No hay pruebas de autorización multiempresa, RLS o concurrencia de reservas porque esas capacidades no se implementan en el Hito 0.
