/**
 * Catálogo de módulos independientes del sector. Sin llamadas a base de datos.
 * En producción, la habilitación de módulos NO equivale a autorización: se
 * comprobará en servidor y mediante RLS para cada petición y operación.
 */
export const MODULES = {
  customers: { label: "Clientes", desc: "Fichas de clientes, historial y contactos", group: "Base", core: true },
  staff: { label: "Equipo", desc: "Empleados, horarios y permisos", group: "Base" },
  locations: { label: "Sedes y cobertura", desc: "Locales, sucursales y áreas de servicio", group: "Base" },
  services: { label: "Servicios", desc: "Servicios, precios y duraciones", group: "Catálogo" },
  products: { label: "Productos", desc: "Productos, variantes y catálogo", group: "Catálogo" },
  bookings: { label: "Citas", desc: "Reservas individuales con franjas horarias", group: "Reservas" },
  capacity: { label: "Reservas de plazas", desc: "Mesas, clases, recursos y capacidad", group: "Reservas" },
  resources: { label: "Recursos", desc: "Salas, equipos y espacios reservables", group: "Reservas" },
  orders: { label: "Encargos y pedidos", desc: "Pedidos, personalización y recogidas", group: "Ventas" },
  stock: { label: "Inventario", desc: "Existencias, movimientos y alertas", group: "Ventas" },
  quotes: { label: "Presupuestos", desc: "Solicitudes, propuestas y aceptación", group: "Comercial" },
  projects: { label: "Proyectos", desc: "Estados de trabajo, tareas y fechas", group: "Operaciones" },
  workOrders: { label: "Órdenes de trabajo", desc: "Diagnósticos, reparaciones y tareas", group: "Operaciones" },
  galleries: { label: "Galerías y entregas", desc: "Archivos, selecciones y aprobaciones", group: "Creatividad" },
  memberships: { label: "Membresías y bonos", desc: "Suscripciones, packs y cuotas", group: "Reservas" },
  classes: { label: "Cursos y clases", desc: "Grupos, matrículas y asistencia", group: "Educación" },
  rentals: { label: "Alquileres", desc: "Disponibilidad, fianzas y devolución", group: "Operaciones" },
  stays: { label: "Alojamientos", desc: "Noches, habitaciones y check-in", group: "Reservas" },
  transport: { label: "Rutas y entregas", desc: "Recogidas, rutas y seguimiento", group: "Operaciones" },
  tickets: { label: "Eventos y entradas", desc: "Aforo, inscripciones y entradas", group: "Reservas" },
  properties: { label: "Inmuebles", desc: "Fichas, visitas y oportunidades", group: "Comercial" },
  contracts: { label: "Contratos", desc: "Documentación y acuerdos", group: "Comercial" },
  communications: { label: "Notificaciones", desc: "Recordatorios y mensajes", group: "Base" },
  payments: { label: "Cobros", desc: "Pagos y anticipos; requiere proveedor externo", group: "Finanzas" },
  invoices: { label: "Facturación", desc: "Documentos fiscales sujetos a normativa", group: "Finanzas" },
} as const;

export type ModuleId = keyof typeof MODULES;
export type OperationId = "appointment" | "capacity" | "order" | "sale" | "quote" | "project" | "rental" | "stay" | "event" | "delivery" | "membership";
export type Sector = {
  id: string;
  label: string;
  family: string;
  examples: string[];
  suggested: ModuleId[];
  operations: OperationId[];
  caution?: string;
};

/** Plantillas orientativas; el usuario puede combinar módulos y sectores. */
export const SECTORS: Sector[] = [
  { id: "photo", label: "Fotografía y vídeo", family: "Creatividad", examples: ["Fotografía de bodas", "Vídeo corporativo", "Estudio audiovisual"], suggested: ["customers", "services", "bookings", "quotes", "projects", "galleries"], operations: ["appointment", "quote", "project"] },
  { id: "beauty", label: "Peluquería y estética", family: "Bienestar", examples: ["Peluquería", "Barbería", "Uñas", "Tratamientos"], suggested: ["customers", "staff", "services", "bookings", "communications"], operations: ["appointment", "sale"] },
  { id: "bakery", label: "Panadería y pastelería", family: "Alimentación", examples: ["Panadería", "Tartas personalizadas"], suggested: ["customers", "products", "orders", "stock"], operations: ["order", "sale"] },
  { id: "food", label: "Restaurante y cafetería", family: "Hostelería", examples: ["Restaurante", "Cafetería", "Bar"], suggested: ["customers", "capacity", "orders", "products", "staff"], operations: ["capacity", "order"] },
  { id: "health", label: "Clínica y salud", family: "Salud", examples: ["Dentista", "Fisioterapia", "Psicología"], suggested: ["customers", "staff", "services", "bookings"], operations: ["appointment"], caution: "Los datos clínicos requerirían un producto especializado y cumplimiento reforzado. Este prototipo no almacena datos de salud." },
  { id: "fitness", label: "Gimnasio y deporte", family: "Bienestar", examples: ["Gimnasio", "Yoga", "Pilates", "Entrenador"], suggested: ["customers", "staff", "services", "classes", "capacity", "memberships"], operations: ["capacity", "membership"] },
  { id: "retail", label: "Tienda y comercio", family: "Comercio", examples: ["Ropa", "Electrónica", "Regalos"], suggested: ["customers", "products", "stock", "orders"], operations: ["sale", "order"] },
  { id: "ecommerce", label: "Comercio electrónico", family: "Comercio", examples: ["Tienda online", "Marca digital"], suggested: ["customers", "products", "stock", "orders", "transport"], operations: ["order", "delivery"] },
  { id: "florist", label: "Floristería", family: "Comercio", examples: ["Ramos", "Decoración floral"], suggested: ["customers", "products", "orders", "transport", "stock"], operations: ["order", "delivery"] },
  { id: "repairs", label: "Taller y reparaciones", family: "Servicios", examples: ["Mecánica", "Bicicletas", "Informática"], suggested: ["customers", "bookings", "quotes", "workOrders", "stock"], operations: ["appointment", "quote", "project"] },
  { id: "trades", label: "Instalaciones y mantenimiento", family: "Servicios", examples: ["Electricidad", "Fontanería", "Climatización"], suggested: ["customers", "bookings", "quotes", "workOrders", "staff", "locations"], operations: ["appointment", "quote", "project"] },
  { id: "construction", label: "Construcción y reformas", family: "Servicios", examples: ["Reformas", "Arquitectura", "Obras"], suggested: ["customers", "quotes", "projects", "staff", "contracts", "stock"], operations: ["quote", "project"] },
  { id: "cleaning", label: "Limpieza y hogar", family: "Servicios", examples: ["Limpieza", "Jardinería", "Desinfección"], suggested: ["customers", "bookings", "staff", "locations", "workOrders"], operations: ["appointment", "project"] },
  { id: "creative", label: "Agencia y servicios creativos", family: "Creatividad", examples: ["Diseño", "Marketing", "Producción musical"], suggested: ["customers", "quotes", "projects", "galleries", "contracts"], operations: ["quote", "project"] },
  { id: "education", label: "Academia y educación", family: "Educación", examples: ["Academia", "Clases particulares", "Idiomas"], suggested: ["customers", "staff", "classes", "capacity", "memberships"], operations: ["capacity", "membership"] },
  { id: "events", label: "Eventos y espectáculos", family: "Ocio", examples: ["Organización de eventos", "Sala de conciertos"], suggested: ["customers", "tickets", "resources", "quotes", "projects"], operations: ["event", "quote", "project"] },
  { id: "lodging", label: "Alojamiento turístico", family: "Turismo", examples: ["Hotel", "Casa rural", "Apartamento"], suggested: ["customers", "stays", "resources", "payments"], operations: ["stay"] },
  { id: "tourism", label: "Excursiones y actividades", family: "Turismo", examples: ["Guía turístico", "Experiencias"], suggested: ["customers", "tickets", "capacity", "staff"], operations: ["event", "capacity"] },
  { id: "pets", label: "Servicios para mascotas", family: "Servicios", examples: ["Peluquería canina", "Cuidadores", "Veterinaria"], suggested: ["customers", "services", "bookings", "stays"], operations: ["appointment", "stay"], caution: "Los servicios veterinarios pueden requerir expedientes y requisitos especializados." },
  { id: "rentals", label: "Alquiler de equipos y vehículos", family: "Alquiler", examples: ["Cámaras", "Bicicletas", "Vehículos", "Maquinaria"], suggested: ["customers", "products", "rentals", "contracts", "resources"], operations: ["rental"] },
  { id: "realestate", label: "Inmobiliaria", family: "Inmuebles", examples: ["Agencia", "Alquileres"], suggested: ["customers", "properties", "bookings", "contracts"], operations: ["appointment", "quote"] },
  { id: "professional", label: "Servicios profesionales", family: "Profesionales", examples: ["Abogacía", "Consultoría", "Asesoría"], suggested: ["customers", "bookings", "quotes", "projects", "contracts"], operations: ["appointment", "quote", "project"], caution: "Según la profesión, debe reforzarse confidencialidad, retención y obligaciones regulatorias." },
  { id: "transport", label: "Logística y transporte", family: "Movilidad", examples: ["Mudanzas", "Mensajería", "Reparto"], suggested: ["customers", "orders", "transport", "staff", "quotes"], operations: ["order", "delivery", "quote"] },
  { id: "industry", label: "Industria y distribución", family: "B2B", examples: ["Mayorista", "Fabricación", "Distribución"], suggested: ["customers", "products", "orders", "stock", "projects"], operations: ["order", "project"] },
  { id: "agriculture", label: "Agricultura y cooperativas", family: "Producción", examples: ["Finca", "Cooperativa", "Productor"], suggested: ["customers", "products", "stock", "orders", "transport"], operations: ["order", "delivery"] },
  { id: "associations", label: "Asociaciones y clubes", family: "Comunidad", examples: ["Club", "Asociación cultural"], suggested: ["customers", "memberships", "tickets", "communications"], operations: ["membership", "event"] },
  { id: "finance", label: "Seguros y finanzas", family: "Regulado", examples: ["Mediación", "Asesoramiento financiero"], suggested: ["customers", "bookings", "contracts", "projects"], operations: ["appointment", "project"], caution: "Los flujos financieros regulados requieren diseño y revisión legal especializada." },
  { id: "hybrid", label: "Otro negocio o actividad mixta", family: "Otros", examples: ["Varios servicios", "Negocio por definir"], suggested: ["customers", "services"], operations: ["appointment", "order", "quote"] },
];

export const sectorById = (id: string): Sector => SECTORS.find(s => s.id === id) ?? SECTORS[0];
export const hasModule = (modules: ModuleId[], id: ModuleId) => modules.includes(id);
