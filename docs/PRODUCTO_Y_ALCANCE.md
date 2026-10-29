# Producto y alcance de AutonoService

La referencia principal y completa es [ESPECIFICACION_MAESTRA.md](ESPECIFICACION_MAESTRA.md). Este documento resume cómo se aplica al prototipo y qué se conserva de las decisiones de dominio existentes.

## Promesa y experiencias

**AutonoService — Tu negocio. Más fácil.** ayuda a autónomos y empresas a gestionar su actividad y conseguir nuevas oportunidades. **Cliente** es la experiencia completamente gratuita para descubrir negocios y reunir sus contrataciones. **AutonoSuite — Todo el potencial de tu negocio.** mejora la gestión profesional dentro de la misma aplicación.

Una persona tiene una identidad global y roles contextuales: puede administrar un estudio, trabajar en otro negocio y reservar una peluquería como Cliente. El selector Mi negocio/Modo cliente cambia el contexto; no crea otra cuenta ni entrega acceso por sí mismo.

## Alcance actual: Hito 0

La tarea actual es actualizar marca, arquitectura, navegación y prototipos: primera entrada con las dos opciones, onboarding profesional y personal, selector, dos paneles y Mi plan. Se conservan el catálogo modular, el perfil de negocio, los productos/servicios y las interacciones locales ya iniciadas.

El negocio publica su catálogo y Cliente lo consulta, solicita o pregunta por él. Esta especificación no incorpora un mercado de productos entre particulares. En fotografía, los archivos del trabajo se comparten en la conversación, separados de las fotos del perfil.

El directorio conserva negocios ficticios. Las solicitudes de reserva no verifican disponibilidad, no bloquean una plaza ni se envían a otro usuario. Los mensajes y archivos de demostración no constituyen un servicio real de comunicaciones. El inventario inspeccionado y los pendientes de validación se registran en [HITO_0.md](HITO_0.md).

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

No se reemplazan estas reglas por una única operación genérica. El prototipo permite comprobar la composición visual sin afirmar que esos motores ya funcionan.

## Modalidades y sectores

Establecimiento físico, varias sedes, a domicilio, online e híbrido. La visibilidad no obliga a publicar una dirección privada. Un negocio puede combinar actividades y especialidades; el catálogo debe admitir sectores futuros sin copiar el núcleo.

La primera validación especializada mantiene fotografía/vídeo, un negocio basado en citas y otro en pedidos. El catálogo no se limita a esos pilotos: contempla también comercio, restauración, reformas, música, diseño, deporte, educación, limpieza, alquiler, consultoría y negocios mixtos.

## Modelo económico por validar

AutonoService gratis debe ser útil para pequeños negocios con límites sostenibles, todavía por medir. AutonoSuite tiene un precio provisional de 99 € por funciones profesionales de la versión adquirida. La actualización mayor de 39 € es una referencia provisional y opcional. Rechazar una actualización no revoca las capacidades locales adquiridas.

Cliente no tiene premium obligatorio. Pagar por un servicio a un comercio es distinto de pagar por usar la plataforma. Los servicios online con costes recurrentes se separan de la licencia; no se promete infraestructura ilimitada de por vida.

Las compras reales y su implementación en web/iOS/Android requieren estudiar los canales y políticas vigentes. No se presenta una simulación de Mi plan como compra o licencia verificada.

## Fuera de esta entrega

Autenticación real, autorización de servidor/RLS, sincronización, reservas confirmadas, catálogo de comercios reales, marketplace completo, geolocalización, mapa, pagos, facturación española operativa, expedientes regulados y aplicaciones nativas publicadas. Se documenta su arquitectura y secuencia sin implementarlos todos ahora.

El paso a Hito 1 sigue sujeto a revisión humana explícita. La aprobación visual tampoco sustituye las pruebas de privacidad, concurrencia y seguridad necesarias para operaciones reales.
