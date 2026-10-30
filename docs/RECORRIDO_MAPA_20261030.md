# Recorrido Empresa → sede → mapa Cliente — 30/10/2026

Entrega sobre `codex/pulido-integracion`, conservando su privacidad de medios, separación demo/real, preferencias por empresa y mensajería. Se integró `main` (`c053ed5`) con sus iconos móviles, auditoría PDF y permisos de borrado de sedes. El propietario autorizó expresamente continuar hasta desplegar.

## Cambios visibles

- Sedes explica los tres requisitos del mapa: empresa pública, sede publicada y pin guardado. Publicar la empresa exige un botón explícito; no publica sus sedes privadas.
- Coordenadas manuales opcionales, con pareja y rangos validados. El mapa reintenta sin recargar ni borrar el formulario.
- Pines independientes por sede, con nombres accesibles, localidad por sede y filtros compartidos con Explorar. Sin resultados, se muestra un estado vacío; no se inventan ubicaciones.
- Cada pin y la lista accesible de sedes abre el perfil comercial de su empresa. El perfil completo conserva fotos y vídeos firmados, servicios, publicaciones, sedes y acciones de contacto.
- `/cliente?negocio=<uuid>` permite volver al perfil dentro de Cliente. Atrás/Adelante y cerrar conservan el origen; repetir una pestaña no crea entradas duplicadas. Sigue requiriendo acceso a Cliente: no se presenta como una ruta SEO anónima nueva.
- Borrado de sede con diálogo accesible y nombre exacto, sin borrar empresa, servicios ni otras sedes.
- Estado público/privado sincronizado entre editor y panel. Cambiar de empresa no muestra servicios, solicitudes o CRM del contexto anterior; se conserva el selector móvil.
- `/version.json` identifica el commit y la fecha de compilación para verificar Cloudflare.

## Auditoría y backend

El PDF conservado en `docs/AUTONOSERVICE_INFORME_UNICO_CODEX_2026-10-30.pdf` tiene 30 páginas y 156698 bytes. Su extracción contiene los mismos 181 identificadores de hallazgos/casos que el Markdown. Sus datos y resultados son históricos, no una certificación del despliegue nuevo.

Antes de la entrega, el backend tenía dos sedes privadas y cero ubicaciones publicadas. No se publican datos del propietario para rellenar el mapa. También carecía de la migración 0012 de `pulido`: el bucket empresarial aún era público y la consulta anónima dependía de un permiso ausente sobre `account_types`.

La migración 0012 y la UI de enlaces firmados forman una misma entrega. La migración `20261030_0006_reconcile_media_cleanup_policy.sql`, generada con la CLI y renombrada para respetar el orden heredado, retira una política DELETE permisiva incorporada en la auditoría de main: se conserva únicamente la limpieza de medios sin referencias. No elimina archivos, cuentas, perfiles ni mensajes. La política de borrado de sedes de main ya estaba aplicada en el backend.

## Validación

La instalación usa el lockfile existente, sin nuevas dependencias de aplicación. La compilación local con Webpack funciona; Turbopack quedó bloqueado en el aislamiento local y se detuvo. La prueba local usa Chromium y transporte Supabase simulado, sin contactar cuentas del propietario. Los tests SQL usan PostgreSQL 17 desechable, sin puertos publicados.

- 74 comprobaciones SQL pasan tras combinar las 18 migraciones, con propietario A/B, Cliente y anónimo. Cubren doble consentimiento, retirada, coordenadas, borrado de sede, permisos cruzados, medios privados y mensajes.
- Los resultados definitivos de TypeScript, unitarias, E2E y despliegue se añaden al cerrar la entrega.

Los mocks no certifican envío ni confirmación de correo, GoTrue, caché de Storage ni Safari físico. La confirmación por correo sigue habilitada en el backend; la protección de contraseñas filtradas continúa pendiente en la configuración de Auth. Esta entrega no añade reservas automáticas, facturación, pagos ni módulos nuevos.
