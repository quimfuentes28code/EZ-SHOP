# AutonoService

**Tu negocio. Más fácil.**

AutonoService reúne la gestión profesional y la experiencia gratuita **Cliente** bajo una misma identidad. **AutonoSuite — Todo el potencial de tu negocio.** es la mejora profesional prevista dentro de la aplicación, con precio provisional de 99 € de pago único. No hay pagos ni licencias comerciales activadas.

El código actual incluye acceso con Supabase, perfil personal compartido, negocios y sedes, servicios, CRM ligado a solicitudes, favoritos, publicaciones, mensajes y adjuntos privados. Su funcionamiento conectado necesita un proyecto Supabase configurado y las migraciones correspondientes. También se conservan las demostraciones locales con datos ficticios; no se mezclan sus operaciones con las cuentas reales.

**Rama publicada de referencia: `main`. Rama de esta revisión: `codex/pulido-integracion`.** Esta revisión corrige integración, privacidad y navegación sobre lo que ya existe; no abre una nueva fase funcional. Consulta [PULIDO_20261029.md](docs/PULIDO_20261029.md), [NOTAS_PRUEBAS.md](docs/NOTAS_PRUEBAS.md) y [AGENTS.md](AGENTS.md).

## Abrir en VS Code

1. Descarga la rama que quieras revisar: `main` para la referencia publicada o `codex/pulido-integracion` para estos cambios cuando estén disponibles en GitHub. Descomprime el ZIP y abre la carpeta que contiene `package.json`, `package-lock.json` y `src`.
2. Utiliza Node.js 22 LTS o una versión compatible y abre **Terminal → Nueva terminal**.
3. Instala desde el lockfile y arranca el desarrollo:

   ```powershell
   npm.cmd ci
   npm.cmd run dev
   ```

4. Abre la dirección indicada en la terminal y mantenla abierta mientras revisas la web.

En Windows, `npm.cmd` evita el bloqueo de `npm.ps1` sin cambiar la política de scripts de PowerShell. En macOS/Linux puedes usar `npm`. No necesitas instalar Next.js globalmente.

## Cuentas conectadas y demostraciones

| Ruta | Qué utiliza |
| --- | --- |
| `/` | Entrada y elección de experiencia |
| `/registro/empresa`, `/registro/cliente` | Acceso, alta y activación del espacio con Supabase |
| `/empresa` | Negocio, servicios, clientes, solicitudes, publicaciones, sedes, mensajes y gestión interna conectados |
| `/cliente` | Descubrimiento, mapa, novedades, favoritos, actividad, mensajes y perfil conectados |
| `/real` | Selector de acceso conservado por compatibilidad |
| `/demo/empresa`, `/demo/cliente` | Paneles históricos de demostración, con datos del navegador |
| `/onboarding`, `/registro` | Configuración profesional/personal de demostración; terminan en `/demo/*` |
| `/explorar`, `/negocio/photo`, `/negocio/beauty`, `/negocio/bakery`, `/negocio/repairs` | Directorio y perfiles ficticios |
| `/mensajes` | Conversaciones y archivos locales de demostración |
| `/mi-plan` | Prototipo de AutonoSuite, sin compra ni cobro |

El selector **Mi negocio / Modo cliente** de las cuentas conectadas conserva la sesión y abre el otro espacio. Si falta su habilitación, ofrece activarlo con la misma identidad. El selector de las demos permanece dentro de `/demo/*`. Sus preferencias se guardan con claves distintas y no conceden permisos.

Los nuevos propietarios pueden registrar una empresa con varias sedes; los negocios históricos independientes se conservan. Las preferencias de herramientas pertenecen a cada empresa. Destacar un módulo organiza los accesos, no sustituye las políticas de autorización.

## Configurar Supabase para desarrollo

Para revisar las demos no hace falta configurar un backend. Las rutas conectadas muestran un aviso si faltan las variables. Para un proyecto de desarrollo autorizado:

1. Crea `.env.local` a partir de `.env.example` y completa únicamente:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=tu-clave-publicable
   ```

2. Usa la clave publicable/anon. **Nunca incluyas una clave `service_role`, una clave secreta o una contraseña de base de datos en `NEXT_PUBLIC_*`, en GitHub o en el cliente.**
3. Revisa las migraciones numeradas de `supabase/migrations/` y el estado que ya tiene ese proyecto; no vuelvas a ejecutar migraciones antiguas sin comprobarlo. La corrección nueva es `20261029_0012_media_privacy_and_profile_permissions.sql` y debe revisarse y validarse antes de aplicarse. Esta entrega no aplica SQL al backend.
4. Configura la confirmación de correo y las URL de retorno autorizadas de `/registro/empresa` y `/registro/cliente` en Supabase Auth.
5. Reinicia el desarrollo o recompila tras cambiar variables: `NEXT_PUBLIC_*` queda incorporado al bundle durante la compilación.

Lee [CUENTA_UNICA_DOS_ESPACIOS.md](docs/CUENTA_UNICA_DOS_ESPACIOS.md) y [PRUEBAS_SQL.md](docs/PRUEBAS_SQL.md). La presencia de políticas en el repositorio no demuestra qué versión está aplicada en un proyecto remoto.

## Privacidad de fotos y archivos

La migración 0012 convierte en privado el bucket histórico `autonoservice-public-media`, corrige sus políticas y los permisos de personalización. Los medios de borradores se consultan por su propietario; los medios publicados se sirven cuando una referencia publicada y su negocio lo permiten. La interfaz genera enlaces firmados de 60 segundos y los renueva durante la visualización. Los adjuntos de chat permanecen en su bucket privado separado. Las URL externas HTTPS heredadas se conservan por compatibilidad y su retirada depende de su proveedor, no de nuestras políticas de Storage.

Esos 60 segundos describen los enlaces emitidos por esta versión, no una garantía universal de revocación: un cliente autorizado puede solicitar otros tiempos al proveedor. Retirar una publicación impide nuevas firmas no autorizadas; no recupera descargas, copias o cachés anteriores. La nueva interfaz comprueba la disponibilidad de la corrección SQL antes de realizar las operaciones de medios que la requieren.

## Revisar la compilación y abrirla en iPhone

La aplicación se exporta como archivos estáticos a `out/`, compatibles con el despliegue Cloudflare existente. `npm start` utiliza el servidor estático incluido en `scripts/serve-static.mjs`; no utiliza `next start`.

```powershell
npm.cmd run build
npm.cmd start -- --hostname 0.0.0.0
```

Consulta la IPv4 del ordenador con `ipconfig`. Conecta el iPhone a la misma Wi-Fi y abre en Safari `http://TU-IP:3000`. Deja la terminal abierta. `localhost` en el teléfono apunta al propio teléfono. Usa una red privada de confianza; no necesitas abrir puertos del router.

Hoy se prueba la **web responsive**, no una aplicación Expo ni TestFlight. Los datos demo se guardan por navegador; los datos conectados se consultan en Supabase con la sesión autorizada. La guía [MOVIL_Y_PRUEBAS.md](docs/MOVIL_Y_PRUEBAS.md) distingue ambos recorridos y el camino futuro para iOS y Android.

## Comprobaciones

```bash
npm ci
npm run typecheck
npm test
npm run verify:e2e
```

En PowerShell utiliza `npm.cmd`. `verify:e2e` compila con un backend ficticio y ejecuta todos los recorridos con peticiones interceptadas; no modifica `.env.local`. Detén cualquier servidor en el puerto 3000 antes de ejecutarlo. Al terminar, vuelve a ejecutar `npm run build` para generar tu vista previa habitual. `test:e2e` ejecuta únicamente Playwright y presupone que ya existe una compilación con los valores ficticios utilizados por los tests. Playwright prueba la exportación estática en el puerto 3000. Si falta Chromium, ejecuta `npx.cmd playwright install chromium` en Windows o `npx playwright install chromium` en macOS/Linux. Puede elegirse un navegador instalado mediante `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.

Los escenarios conectados automatizados utilizan respuestas Supabase simuladas y cuentas ficticias; no realizan operaciones sobre el backend del propietario. Las comprobaciones SQL se ejecutan con `npm run test:sql` y necesitan Docker local con contenedores Linux; utilizan una base desechable sin red ni puertos publicados. Los resultados vigentes y sus límites están en [NOTAS_PRUEBAS.md](docs/NOTAS_PRUEBAS.md).

## Alcance y documentación

Están pendientes el motor de reservas con disponibilidad/concurrencia, los permisos delegados de empleados, los pagos, las licencias, la facturación fiscal, la sincronización offline completa, la moderación y la publicación de apps nativas. La agenda y los presupuestos actuales son registros internos y borradores, no reservas confirmadas ni facturas.

- [Especificación maestra](docs/ESPECIFICACION_MAESTRA.md): identidad y objetivos de producto.
- [Arquitectura](docs/ARQUITECTURA.md): código conectado actual y evolución propuesta.
- [Roadmap](docs/ROADMAP.md): planificación y capacidades parciales existentes.
- [Identidad visual](docs/IDENTIDAD_VISUAL.md): marca compartida, temas y referencias.
- [Hito 0](docs/HITO_0.md): antecedente histórico de las demos y sus capturas.

Las capturas anteriores de `docs/previews/` corresponden al prototipo histórico. Esta revisión añade capturas de [Empresa](docs/previews/pulido-empresa.png), [Cliente en móvil](docs/previews/pulido-cliente-movil.png), [Cliente en oscuro](docs/previews/pulido-cliente-oscuro.png) y [perfil móvil](docs/previews/pulido-perfil-movil.png), con cuentas y respuestas ficticias de prueba. No acreditan un despliegue conectado ni una prueba en un iPhone físico.
