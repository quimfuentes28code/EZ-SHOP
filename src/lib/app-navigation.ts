/** Navigation describes screens only; it never grants access to account data. */
export type AppExperience = "customer" | "business";
export type NavigationIcon = "compass" | "map" | "heart" | "messages" | "profile" | "home" | "calendar" | "management" | "customers" | "requests" | "services" | "locations" | "tools" | "store";
export type AppNavigationItem = { id: string; label: string; icon: NavigationIcon };

export const CLIENT_NAVIGATION = [
  { id: "explorar", label: "Explorar", icon: "compass" },
  { id: "mapa", label: "Mapa", icon: "map" },
  { id: "favoritos", label: "Favoritos", icon: "heart" },
  { id: "mensajes", label: "Mensajes", icon: "messages" },
  { id: "perfil", label: "Perfil", icon: "profile" },
] as const satisfies readonly AppNavigationItem[];

export const BUSINESS_NAVIGATION = [
  { id: "inicio", label: "Inicio", icon: "home" },
  { id: "agenda", label: "Agenda", icon: "calendar" },
  { id: "mensajes", label: "Mensajes", icon: "messages" },
  { id: "gestion", label: "Gestión", icon: "management" },
  { id: "perfil", label: "Perfil", icon: "store" },
] as const satisfies readonly AppNavigationItem[];

export const BUSINESS_DESKTOP_GROUPS = [
  { label: "Inicio", items: [{ id: "inicio", label: "Panel general", icon: "home" }] },
  { label: "Agenda", items: [{ id: "workboard", label: "Proyectos y agenda", icon: "calendar" }] },
  { label: "Mensajes", items: [{ id: "mensajes", label: "Conversaciones", icon: "messages" }] },
  { label: "Gestión", items: [
    { id: "clientes", label: "Clientes", icon: "customers" },
    { id: "solicitudes-empresa", label: "Solicitudes", icon: "requests" },
    { id: "gestion", label: "Servicios", icon: "services" },
    { id: "sedes", label: "Tiendas y sedes", icon: "locations" },
  ] },
  { label: "Perfil público", items: [{ id: "negocio", label: "Perfil público", icon: "store" }] },
  { label: "Herramientas", items: [{ id: "herramientas", label: "Herramientas", icon: "tools" }] },
] as const satisfies readonly { label: string; items: readonly AppNavigationItem[] }[];

const managementDescriptions: Record<string, string> = {
  clientes: "Contactos e historial autorizado de tu negocio",
  gestion: "Catálogo de servicios y precios",
  "solicitudes-empresa": "Solicitudes recibidas y sus estados",
  workboard: "Proyectos, trabajos y planificación interna",
  sedes: "Establecimientos, horarios y ubicaciones",
  herramientas: "Módulos disponibles y accesos destacados",
};

/** The management hub is another entry to these destinations, not new copies. */
export const BUSINESS_MANAGEMENT_ITEMS = BUSINESS_DESKTOP_GROUPS
  .filter(group => ["Gestión", "Agenda", "Herramientas"].includes(group.label))
  .flatMap(group => group.items as readonly AppNavigationItem[])
  .map(item => ({ ...item, description: managementDescriptions[item.id] }));

export function navigationFor(experience: AppExperience): readonly AppNavigationItem[] {
  return experience === "customer" ? CLIENT_NAVIGATION : BUSINESS_NAVIGATION;
}

/** Legacy sections keep their destination while selecting the new parent. */
export function customerPrimarySection(section: string): string {
  if (section === "actividad") return "perfil";
  if (section === "novedades") return "explorar";
  return CLIENT_NAVIGATION.some(item => item.id === section) ? section : "explorar";
}

export function businessPrimarySection(section: string): string {
  if (section === "inicio" || section === "mensajes") return section;
  if (section === "agenda" || section === "workboard") return "agenda";
  if (section === "negocio" || section === "diseno" || section === "perfil") return "perfil";
  return "gestion";
}
