# Producto y alcance de AutonoService

La referencia principal y completa es [ESPECIFICACION_MAESTRA.md](ESPECIFICACION_MAESTRA.md). Este documento resume cómo se aplica al prototipo y qué se conserva de las decisiones de dominio existentes.

## Promesa y experiencias

**AutonoService — Tu negocio. Más fácil.** ayuda a autónomos y empresas a gestionar su actividad y conseguir nuevas oportunidades. **Cliente** es la experiencia completamente gratuita para descubrir negocios y reunir sus contrataciones. **AutonoSuite — Todo el potencial de tu negocio.** mejora la gestión profesional dentro de la misma aplicación.

Una persona tiene una identidad global y roles contextuales: puede administrar un estudio, trabajar en otro negocio y reservar una peluquería como Cliente. El selector Mi negocio/Modo cliente cambia el contexto; no crea otra cuenta ni entrega acceso por sí mismo.

## Alcance de la revisión actual

El propietario ha autorizado pulir la integración existente: corregir permisos, privacidad de medios, chat, navegación real/demo, búsqueda por sedes, módulos y pruebas, conservando las funciones que ha incorporado a `main`. Las migraciones correctivas se preparan para revisión; no se aplican al backend en esta entrega.

Las rutas `/empresa` y `/cliente` utilizan Supabase para cuentas, perfiles, servicios, CRM, solicitudes, favoritos, publicaciones, mensajes y sedes. El mapa conectado muestra sedes con coordenadas publicadas voluntariamente. La agenda y los presupuestos son registros internos y borradores; no hay motor de reservas o facturación fiscal.

Las demos conservan datos locales ficticios en `/demo/empresa`, `/demo/cliente`, `/explorar`, `/negocio/*` y `/mensajes`. Sus solicitudes no se envían ni bloquean disponibilidad. El catálogo lo publica el negocio; esta especificación no introduce un mercado de productos entre particulares. Los adjuntos privados de un trabajo se mantienen separados de la presentación comercial.

## Núcleo reutilizable

- Identidad global, organizaciones, membresías, permisos y sedes.
- Contactos por empresa y vínculos opcionales verificados con Cliente.
- Sectores como plantillas y capacidades configurables por negocio.
- Servicios, productos, recursos y disponibilidad cuando se implemente cada dominio.
- Solicitudes, documentos, conversaciones y adjuntos privados.
- Perfil público separado de datos internos, con consentimiento y cobertura adecuados.

## Dominios operativos

1. Cita individual: duración, profesional, buffers, horario y cancelación.
2. Reserva de capacidad: mesas, asientos, grupos y simultaneidad.
3. Encargo/pedido: personalización, preparación, recogida, entrega y estado.
4. Venta de producto: variantes, inventario y devoluciones.
5. Presupuesto: versiones, caducidad, negociación y aceptación.
6. Proyecto/orden de trabajo: tareas, hitos, responsables y entregables.
7. Alquiler: activo, intervalo, fianza, devolución y disponibilidad.
8. Alojamiento: unidad, noches, check-in y condiciones.
9. Evento/clase: cupos, inscripciones y asistencia.
10. Membresía: renovación, créditos y suspensión.
11. Entrega/ruta: cobertura, paradas y trazabilidad.

No se reemplazan estas reglas por una única operación genérica. Las demos permiten comprobar la composición visual y la gestión interna conectada conserva registros sencillos. Ninguna de ellas declara implementados todos esos motores especializados.

## Modalidades y sectores

Establecimiento físico, varias sedes, a domicilio, online e híbrido. La visibilidad no obliga a publicar una dirección privada. Un negocio puede combinar actividades y especialidades; el catálogo debe admitir sectores futuros sin copiar el núcleo.

La primera validación especializada mantiene fotografía/vídeo, un negocio basado en citas y otro en pedidos. El catálogo no se limita a esos pilotos: contempla también comercio, restauración, reformas, música, diseño, deporte, educación, limpieza, alquiler, consultoría y negocios mixtos.

## Modelo económico por validar

AutonoService gratis debe ser útil para pequeños negocios con límites sostenibles, todavía por medir. AutonoSuite tiene un precio provisional de 99 € por funciones profesionales de la versión adquirida. La actualización mayor de 39 € es una referencia provisional y opcional. Rechazar una actualización no revoca las capacidades locales adquiridas.

Cliente no tiene premium obligatorio. Pagar por un servicio a un comercio es distinto de pagar por usar la plataforma. Los servicios online con costes recurrentes se separan de la licencia; no se promete infraestructura ilimitada de por vida.

Las compras reales y su implementación en web/iOS/Android requieren estudiar los canales y políticas vigentes. No se presenta una simulación de Mi plan como compra o licencia verificada.

## Fuera de esta entrega

Motor de reservas con disponibilidad y concurrencia, permisos delegados avanzados, sincronización offline completa, marketplace completo, localización automática del Cliente, pagos y licencias comerciales, facturación española operativa, expedientes regulados y aplicaciones nativas publicadas.

La revisión no sustituye los servicios conectados por demos ni declara que las políticas SQL estén ya aplicadas y validadas en un entorno remoto. Nuevas fases y cambios de alcance requieren permiso del propietario; véanse [ROADMAP.md](ROADMAP.md) y [NOTAS_PRUEBAS.md](NOTAS_PRUEBAS.md).
