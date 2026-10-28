# Visión de producto y alcance inicial

## Promesa
Una cuenta de empresa para gestionar operaciones específicas del negocio; una cuenta personal para consultar y gestionar relaciones con distintos negocios; directorio y descubrimiento local como fase posterior.

## Perfiles
- **Propietario**: crea empresa, configura módulos, gestiona empleados, ubicaciones, pagos y suscripción futura.
- **Empleado**: acceso limitado por sede, rol, recurso y operación, nunca por simple ocultación de pantalla.
- **Cliente**: una identidad propia, sin pertenecer a la empresa, que permite consultar sus propias reservas, pedidos y proyectos cuando la relación esté verificada.
- **Visitante**: consulta perfiles públicos y solicita o reserva servicios bajo condiciones fijadas por negocio. No se obliga a crear cuenta en el primer contacto.
- **Administrador de plataforma**: soporte y moderación auditables, sin acceso indiscriminado a datos sensibles.

## Modalidades de empresa
- Establecimiento físico (una o varias sedes).
- A domicilio / desplazamientos (zonas de cobertura y recargos por desplazamiento).
- Online (sin pin físico de contacto).
- Mixto (varias modalidades por servicio y sede).
- Empresas con varias actividades y múltiples especialidades (varias plantillas, composición de módulos).

## Núcleo funcional reutilizable
- Organizaciones, membresías, permisos y sucursales.
- Clientes vinculados a cada organización y a una identidad global opcional.
- Servicios, recursos, disponibilidad y calendario.
- Solicitudes, presupuestos, contratos y estados de trabajos.
- Comunicaciones, archivos, adjuntos y notificaciones.
- Pagos y facturación (fase posterior, integraciones revisadas por país).
- Perfil público, preferencias de visibilidad y descubrimiento (fase posterior).

## Operaciones de dominio
1. Cita individual: duración, profesional, horario, cancelación, buffer, zona horaria.
2. Reserva de capacidad: mesas, asientos, plazas, grupos, simultaneidad.
3. Encargo/pedido: catálogo, personalización, recogida, envío, estado.
4. Venta de producto: variantes, inventario, devoluciones.
5. Solicitud de presupuesto: negociación, aceptación, versión y caducidad.
6. Proyecto/orden de trabajo: hitos, asignados, tareas, entregables, aprobaciones.
7. Alquiler: activo, intervalo, disponibilidad, fianza, devolución.
8. Alojamiento: unidad, noches, check-in, políticas y disponibilidad.
9. Evento/clase: grupo, cupos, inscripciones y asistencias.
10. Membresía: renovación, cuotas, créditos, suspensión.
11. Entrega/ruta: zonas, paradas, eventos logísticos y trazabilidad.

## Primer sector de demostración
Fotografía y vídeo, porque permite probar reservas + presupuestos + proyectos + galerías; sin embargo el backend no deberá codificar reglas por `sector_id` salvo adaptadores realmente especializados.

## Dos sectores siguientes para validar reutilización
Peluquería (citas y empleados) y pastelería (catálogo, encargos y recogidas). Si añadirlos obliga a copiar todo el código, hay un problema de arquitectura.

## Funciones que NO se incluyen en el MVP inicial
- Mapa de servicios reales y ranking de negocios.
- Pasarela de pagos para terceros y comisiones.
- Datos sanitarios y otros expedientes regulados.
- Contabilidad/fiscalidad por países.
- Motor de automatizaciones personalizadas sin límites.
- Marketplace con reseñas verificadas, disputas y logística.
- Apps móviles nativas independientes.

## Criterios comerciales
Cobro principal a empresas por ahorro de tiempo. La cuenta de cliente gratuita puede ayudar a fidelizar, pero el marketplace necesita densidad local para ser útil. Validar demanda con 10-20 entrevistas y 2-3 pilotos de pago antes de ampliar sectores.
