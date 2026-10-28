# Prompts secuenciales para Codex

## 1. PRIMER PROMPT: ejecutar ahora (Hito 0)

```text
Estamos construyendo una plataforma SaaS modular de gestión para negocios llamada provisionalmente Nexo.

Lee primero README.md, AGENTS.md y los documentos de docs/. No presupongas que es software solo para fotógrafos: contempla negocios muy diversos, pero mantén el desarrollo limitado al Hito 0.

Revisa el proyecto Next.js del repositorio, instala sus dependencias y ejecuta:
- npm run typecheck
- npm run build
Corrige cualquier error.

Después revisa y mejora el prototipo navegable de las rutas /, /onboarding, /empresa, /cliente y /explorar. Haz que el diseño sea profesional, minimalista, oscuro, responsive y accesible.

Asegúrate de que:
1. El onboarding permite elegir sector, modalidad, módulos y datos básicos.
2. El menú del panel se adapte a los módulos elegidos.
3. La cuenta de cliente sea independiente del panel empresa.
4. El directorio y el futuro mapa se identifiquen claramente como prototipos.
5. No se envíen reservas ni se simule que existen cuentas reales.
6. No se conecte Supabase ni un procesador de pagos todavía.
7. Las arquitecturas de módulos y operaciones se mantengan separadas.

Entrega un resumen de archivos cambiados, comandos ejecutados, posibles errores y cómo ver el proyecto. No avances al Hito 1 sin mi aprobación.
```

## 2. SEGUNDO PROMPT (solo después de aprobar Hito 0)

```text
Ahora inicia el Hito 1 según docs/ROADMAP.md. Diseña primero el esquema de organizaciones, usuarios globales, membresías y configuración de módulos. Usa Supabase Auth/PostgreSQL con controles RLS reales. Antes de aplicar migraciones explica el diseño y propone pruebas de aislamiento entre empresas. No uses datos de producción ni claves secretas en el cliente. Conecta únicamente registro/login y creación de empresa, y para cuando las pruebas de autorización pasen.
```

## 3. TERCER PROMPT (solo después de aprobar Hito 1)

```text
Implementa el Hito 2: CRM mínimo + servicios y reservas. Asegura que una reserva pertenece a una empresa y recurso, con validación de permisos, concurrencia, zona horaria, descansos y cancelaciones. Escribe pruebas que intenten reservar simultáneamente el mismo recurso. No agregues pagos, marketplace ni mapa.
```
