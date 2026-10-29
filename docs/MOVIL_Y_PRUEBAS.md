# Probar AutonoService en iPhone y Android

## Lo que se puede probar hoy

El proyecto existente es una web Next.js responsive con exportación estática. Puede abrirse en Safari de iPhone o Chrome de Android desde la misma red local que el ordenador. `/empresa` y `/cliente` usan las cuentas conectadas cuando Supabase está configurado; las demos se conservan en rutas propias. El inventario está en [README.md](../README.md). **Todavía no existe una aplicación Expo distribuible, un QR de Expo Go ni una versión en TestFlight.** No se debe intentar abrir el servidor Next.js con Expo Go.

### iPhone + ordenador Windows

1. Abre la carpeta del proyecto en VS Code. Debe contener `package.json`, `package-lock.json` y `src`.
2. En una terminal PowerShell instala las dependencias:

   ```powershell
   npm.cmd ci
   ```

3. Detén con `Ctrl+C` cualquier servidor de desarrollo anterior. Compila la versión que vas a revisar:

   ```powershell
   npm.cmd run build
   ```

4. Cuando la compilación termine sin errores, inicia el servidor estático incluido, accesible desde la red local:

   ```powershell
   npm.cmd run start -- --hostname 0.0.0.0
   ```

5. Deja esa terminal abierta. Abre otra y ejecuta:

   ```powershell
   ipconfig
   ```

6. Busca la **Dirección IPv4** del adaptador Wi-Fi que utilizas, por ejemplo `192.168.1.25`. No uses direcciones de un adaptador virtual, una VPN o el valor `0.0.0.0`.
7. Conecta el iPhone a la misma Wi-Fi. En Safari escribe la dirección de ese ordenador con el puerto 3000; con la IP de ejemplo sería `http://192.168.1.25:3000`.

`npm start` utiliza `scripts/serve-static.mjs` para servir `out/`, compatible con `output: "export"`. No ejecutes `next start` para esta configuración. En el iPhone, `localhost` apunta al propio teléfono, no al ordenador. La IP del ejemplo debe sustituirse por la tuya. Las pruebas de esta red local no crean una web pública.

Si Windows pide permitir Node.js en la red, limita el acceso a la red privada de confianza. No hace falta abrir puertos del router ni exponer el ordenador a Internet. Si el teléfono no conecta, comprueba primero que el servidor sigue abierto, la IP es correcta, ambos dispositivos usan la misma Wi-Fi y la red no aísla sus dispositivos. Una VPN o una red de invitados puede impedir la conexión.

`npm.cmd` evita el bloqueo de `npm.ps1` en PowerShell sin cambiar su política de ejecución. Si Windows no encuentra el comando, instala Node.js LTS y vuelve a abrir VS Code.

### Alternativa durante desarrollo

El recorrido anterior utiliza la compilación para evitar depender de HMR/orígenes de desarrollo. Si quieres probar cambios en vivo, inicia `npm.cmd run dev -- --hostname 0.0.0.0` en lugar de `start`. Next.js puede restringir recursos de desarrollo según el origen. Si al abrir desde el teléfono se ve la página pero los controles no responden y la terminal muestra un origen bloqueado, añade **sólo el hostname/IP local mostrado** a `allowedDevOrigins` en `next.config.ts` y reinicia el servidor. No uses un comodín global como solución. El repositorio ya admite `127.0.0.1` para las pruebas automatizadas locales.

La alternativa recomendada para una revisión visual estable sigue siendo la compilación sin HMR indicada arriba. Sus comandos son:

```powershell
npm.cmd run build
npm.cmd run start -- --hostname 0.0.0.0
```

Después vuelve a abrir la IP local del ordenador en Safari. Algunas capacidades del navegador exigen HTTPS y no están disponibles en una IP HTTP local; una vista responsive no prueba ubicación, push, cámara o funciones nativas. El mapa conectado usa las coordenadas publicadas voluntariamente por los negocios; no solicita la localización automática del Cliente. Las subidas y otras APIs del navegador deben revisarse también desde un origen HTTPS de desarrollo autorizado.

### Android y otros ordenadores

En Android abre la misma dirección local en Chrome. En macOS/Linux puedes usar `npm` en lugar de `npm.cmd` y consultar la IP del equipo en sus ajustes de red. Revisa las vistas en vertical y horizontal, teclado en pantalla, tamaño de texto, foco, modales y ausencia de desplazamiento horizontal involuntario.

## Recorridos separados de revisión

### Cuentas conectadas

1. Configura el frontend con las variables públicas de un proyecto Supabase de desarrollo autorizado y revisa las migraciones ya aplicadas antes de compilar. El alta puede requerir retorno a una URL autorizada en Supabase; revisa la configuración de correo para el origen utilizado.
2. Entra mediante `/registro/empresa` o `/registro/cliente`. Una persona utiliza el mismo correo y contraseña en ambos espacios, sin duplicar su identidad.
3. Cambia mediante **Mi negocio / Modo cliente**. Si falta el segundo espacio, debe ofrecer activarlo conservando la sesión.
4. Revisa el perfil comercial, publicaciones, catálogo, sedes, solicitudes, conversación y archivos de prueba. Busca una ciudad en la que exista una sede publicada.
5. Comprueba foco y cierre del perfil emergente, teclado en pantalla, targets táctiles y ambos temas.

Los datos conectados se almacenan en Supabase y pueden consultarse desde el iPhone y el ordenador con la misma identidad autorizada y conexión. Eso no implementa sincronización offline ni garantiza que la configuración de un backend remoto coincida con las migraciones del repositorio. La corrección 0012 está preparada, pero no se aplica al proyecto del propietario en esta revisión.

### Demostraciones locales

- `/onboarding` y `/registro` configuran las demos y terminan en `/demo/empresa` y `/demo/cliente`.
- `/explorar`, `/negocio/photo` y los otros perfiles ficticios permiten revisar el catálogo y solicitudes de ejemplo.
- `/mensajes` conserva conversaciones locales; `/mi-plan` muestra AutonoSuite sin compras.
- El selector de demostración permanece dentro de las demos y no abre el acceso conectado.

Los datos demo pertenecen a cada navegador. No se sincronizan entre Safari y el ordenador; una recarga puede perder los bytes de un adjunto de sesión y debe mostrarlo. La alternativa a `crypto.randomUUID` de los identificadores demo no demuestra por sí sola compatibilidad de todas las APIs conectadas en HTTP local.

Una revisión en Safari físico sigue siendo necesaria: los escenarios Chromium y los mocks automatizados no la sustituyen.

## Camino futuro de la aplicación móvil

La arquitectura propuesta es React Native + Expo dentro de un monorepositorio evolutivo. Compartirá dominio, contratos, tipos, validaciones y tokens con la web, con adaptadores de rutas, almacenamiento y funciones del sistema.

### 1. Expo Go: primera aplicación compatible

**Pendiente de crear `apps/mobile`.** Cuando exista una app Expo con funciones compatibles:

1. Instalar Expo Go en el dispositivo y las dependencias del proyecto móvil.
2. Iniciar el servidor desde el directorio de esa app con `npx expo start`, una vez creado y documentado el proyecto Expo.
3. En un iPhone físico, la documentación Expo consultada exige iniciar sesión con la misma cuenta Expo en CLI y Expo Go. Esto pertenece al futuro entorno de desarrollo Expo; no es otra cuenta de usuario de AutonoService.
4. Abrir el QR/enlace compatible, con red local o el transporte configurado.
5. Verificar el flujo básico y la lógica compartida.

Expo Go tiene un conjunto de módulos nativos preincluidos. No basta para cualquier biblioteca nativa, compras o comportamiento de producción. Su compatibilidad debe comprobarse con la versión del SDK elegida; no se promete que toda función futura funcione allí.

### 2. Development Builds

Cuando se necesiten módulos nativos, configuración propia o pruebas más cercanas al producto distribuible, crear una development build con Expo. Definir identificadores de aplicación, entornos separados y permisos mínimos; instalarla en dispositivos autorizados y conectarla al servidor de desarrollo cuando corresponda.

Las credenciales de firma se gestionarán mediante el flujo seguro del proveedor, no en el repositorio o en el chat. Un desarrollo nativo iOS local requiere macOS y Xcode; desde Windows se puede evaluar el servicio de compilación remota de Expo según sus condiciones y cuotas. No se genera ninguna build en esta entrega.

### 3. TestFlight

Antes de distribuir un prototipo iOS real harán falta la membresía y configuración aplicables de Apple Developer, un identificador de app y su registro en App Store Connect, firma y build válidas. Una build iOS de distribución puede subirse con EAS Submit desde Windows, macOS o Linux según la documentación Expo consultada; esto no elimina los requisitos de firma, cuenta Apple o revisión. Se cargará una build preparada para distribución, se configurarán testers y, cuando corresponda, se completará la revisión para pruebas externas.

TestFlight permite probar una build distribuida; no reemplaza las pruebas de aislamiento, licencias o seguridad. Las builds y sus canales tienen condiciones de vigencia y distribución que deben consultarse al preparar el envío.

### 4. Publicación en App Store

Preparar privacidad, permisos, información de la app, capturas, soporte, eliminación de cuenta cuando corresponda, clasificación, condiciones de los servicios y compras permitidas. Verificar funcionamiento en dispositivos y versiones soportados y completar la revisión de Apple.

Antes de implementar licencias reales, estudiar las reglas vigentes para funciones digitales, restauración y actualizaciones opcionales. Las excepciones y condiciones regionales pueden afectar enlaces, medios de pago y derechos; no se copia sin revisión el checkout web dentro de iOS.

### Android

1. Prototipo compatible en Expo Go cuando proceda.
2. Development build para funciones nativas propias.
3. Build firmada y prueba interna en dispositivos Android; después pruebas cerradas/abiertas según requisitos y acceso disponibles.
4. Distribución por Google Play con identificador, firma, fichas, privacidad/Data Safety, permisos y requisitos de pruebas vigentes.
5. Verificación de Play Billing y reglas de compras/restauración antes de activar capacidades digitales de pago.

La firma, el versionado y los canales de distribución serán independientes de iOS. Los requisitos de publicación cambian: se revisarán en los paneles oficiales cuando se prepare cada envío.

## Matriz de pruebas prevista

| Área | Web actual | Móvil futuro |
| --- | --- | --- |
| Dominio/validaciones | Suites unitarias TypeScript | Reutilizar las mismas reglas y añadir pruebas de adaptador |
| UI | Playwright, teclado, responsive y navegadores objetivo | Componentes nativos accesibles, lectores de pantalla y navegación táctil |
| Persistencia | Datos corruptos, cuota/bloqueo y migración de claves | SQLite, suspensión/proceso cerrado, migraciones y almacenamiento seguro |
| Offline/sincronización | Diseñar y verificar antes de prometer funcionamiento completo | Modo avión, outbox, conflictos y revocación al reconectar |
| Reservas/archivos | Solicitudes y archivos locales de demostración | Operaciones reales sólo tras backend, permisos y concurrencia verificados |
| Licencias | Prototipo sin compra | Sandbox de tienda y restauración por canal antes de monetización |
| Distribución | Build Next.js | Builds de desarrollo, TestFlight y pruebas de Play |

## Fuentes oficiales para preparar la implementación

- [Expo: empezar a desarrollar](https://docs.expo.dev/get-started/start-developing/).
- [Expo: introducción a development builds](https://docs.expo.dev/develop/development-builds/introduction/).
- [Expo: crear una build](https://docs.expo.dev/build/introduction/).
- [Expo: envío a tiendas](https://docs.expo.dev/submit/introduction/).
- [Apple: TestFlight](https://developer.apple.com/testflight/).
- [Apple: App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/).
- [Google Play: política de pagos](https://support.google.com/googleplay/android-developer/answer/9858738).
- [Android: canales de prueba](https://support.google.com/googleplay/android-developer/answer/9845334).

### Consulta histórica del Hito 0 y límites de acceso

En esta revisión se leyeron fuentes técnicas oficiales de Expo desde su repositorio público:

- [Inicio de desarrollo](https://raw.githubusercontent.com/expo/expo/main/docs/pages/get-started/start-developing.mdx).
- [Development builds](https://raw.githubusercontent.com/expo/expo/main/docs/pages/develop/development-builds/introduction.mdx).
- [Configuración de builds](https://raw.githubusercontent.com/expo/expo/main/docs/pages/build/setup.mdx).
- [Envío iOS](https://raw.githubusercontent.com/expo/expo/main/docs/pages/submit/ios.mdx).

La lectura directa de las políticas comerciales de Apple y Google y de `docs.expo.dev` respondió 403 por la política de red de esta instancia. Se guardaron los destinos necesarios en el borrador de red, pero eso no los aplica ni publica automáticamente. Las condiciones actuales de compras, licencias y excepciones de tienda **no se consideran verificadas ni cerradas** por esta entrega; deben consultarse antes de la implementación real. Las fuentes técnicas Expo sí se consultaron mediante su repositorio oficial permitido.

Este documento no afirma que se haya publicado una app ni que un mecanismo comercial concreto esté aprobado por Apple o Google.
