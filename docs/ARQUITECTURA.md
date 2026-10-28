# Arquitectura técnica — propuesta evolutiva

## Stack propuesto
- Next.js App Router + TypeScript + interfaz responsive.
- Supabase/PostgreSQL con Auth y Row Level Security; Supabase Storage para medios cuando proceda.
- Despliegue web; observabilidad y errores en fases posteriores.
- Servicios de mapas/geocodificación como adaptadores reemplazables, no embebidos en el núcleo.
- Integración de pagos solo al validar modelos y requisitos de marketplace.

## Bloques lógicos

```text
Identidad global de usuario (Auth)
    ├── Membresías a varias organizaciones -> espacio empresa
    ├── Relaciones verificadas con organizaciones -> espacio cliente
    └── Preferencias personales / privacidad

Organización (tenant)
    ├── Sedes / ubicación o zona de servicio
    ├── Actividades y plantillas de sector (una o varias)
    ├── Registro de módulos activados + configuración por módulo
    ├── Miembros / roles / permisos
    ├── Clientes / servicios / recursos
    ├── Dominios: citas, pedidos, presupuestos, proyectos, alquileres...
    └── Perfil público opcional para directorio

Composición visual de UI
    ├── Módulos registrados por código estable
    ├── Navegación condicional por capacidades reales
    └── Formularios y flujos por dominio operativo
```

## Tablas base — primer diseño lógico, no migraciones de producción
- `profiles(user_id PK, display_name, preferences)`
- `organizations(id PK, name, slug, visibility, created_by, ...)`
- `organization_members(id PK, organization_id FK, user_id FK, role, status)`
- `branches(id PK, organization_id FK, public_address?, timezone, mode, location_precision, ...)`
- `sector_templates(id PK, label, family, version)`
- `organization_sectors(organization_id FK, sector_id FK)`
- `module_definitions(id PK, version, capabilities, status)`
- `organization_modules(organization_id FK, module_id FK, enabled, settings_json)`
- `contacts(id PK, organization_id FK, ..., linked_user_id NULLABLE)`
- `client_links(id PK, organization_id FK, contact_id FK, user_id FK, verification_method, verified_at)`
- `services(id PK, organization_id FK, branch_id?, capacity_policy, pricing_policy, ...)`
- `resources(id PK, organization_id FK, branch_id FK, type, availability_policy)`
- `bookings(id PK, organization_id FK, client_link_id?, service_id FK, resource_id?, status, start_at, end_at, ...)`
- `quotes`, `projects`, `orders`, `deliverables`, `rentals`, etc. en esquemas lógicos propios y con `organization_id`.

Los identificadores y asociaciones anteriores son una propuesta, NO un diseño SQL listo para producción. Añadir migraciones revisadas, índices, restricciones, borrado, retención, auditoría y pruebas antes de activarlas.

## Principios de aislamiento
- Toda fila privada operativa pertenece a una organización. La pertenencia se valida en una función de autorización del servidor y en políticas RLS.
- Un usuario puede gestionar varias empresas y ser cliente en otras. El selector de empresa no cambia sus permisos efectivos.
- Las claves públicas de Supabase nunca omiten RLS. Claves de servicio solo en backend seguro, nunca en el navegador.
- Los usuarios y contactos no se fusionan automáticamente porque coincida un nombre o correo no verificado.
- Un cliente solo consulta lo suyo cuando se autentica o presenta un token de invitación limitado, de un solo propósito y con caducidad.
- Los enlaces de archivos privados usan URLs firmadas de corta duración y comprobación de propiedad.
- Concurrencia en reservas: transacción y reglas atómicas para evitar doble reserva, control de zona horaria/DST y restricciones específicas según recurso o capacidad.
- Historial/auditoría para cambios de estado relevantes y acciones administrativas.
- Accesos públicos limitados a negocios que hayan elegido visibilidad y a campos explícitamente publicados.
- Ubicación exacta de un profesional a domicilio: no publicar salvo opt-in claro; usar áreas de cobertura.

## Organización del código (objetivo)
```text
src/app/                # Rutas y vistas
src/components/         # Elementos UI reutilizables
src/lib/catalog.ts      # Catálogo tipado y plantillas sectoriales
src/lib/demo.ts         # Solo almacenamiento demo
src/features/<dominio>/ # Lógica y componentes por dominio (Hitos 1+)
src/server/             # Autorización, servicios backend, integración DB (Hitos 1+)
supabase/migrations/    # Migraciones revisadas (Hitos 1+)
```

## Estados de capacidad (evitan confusión)
- `planned`: idea/catálogo, no activable en producción.
- `preview`: solo UI demostrativa, sin operaciones reales.
- `beta`: función usable con límites y seguimiento.
- `stable`: aprobada y soportada.
- `regulated`: requiere evaluación y controles adicionales.

## Secuencia de arquitectura
Hito 0 UI demo -> Hito 1 auth y organizaciones + permisos -> Hito 2 reservas/CRM -> Hito 3 presupuesto/proyecto -> Hito 4 cuenta cliente global verificada -> Hito 5 segundo/tercer sector -> Hito 6 directorio -> Hito 7 mapa. No introducir complejidad antes de que la necesite el producto.
