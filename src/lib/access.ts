import type { OrganizationRole } from "./experience";

export type ProfessionalPlan = "free" | "suite";
export type LicensePlatform = "web" | "ios" | "android";
export type FeatureId =
  | "crm.basic"
  | "agenda.local"
  | "projects.basic"
  | "quotes.basic"
  | "profile.edit"
  | "modules.configure"
  | "crm.advanced"
  | "projects.advanced"
  | "quotes.advanced"
  | "analytics.advanced"
  | "invoices.issue"
  | "ai.assistant";
export type FeatureDefinition = {
  label: string;
  tier: ProfessionalPlan;
  minimumVersion: number;
  roles: readonly OrganizationRole[];
  status: "preview" | "planned";
};
const members: readonly OrganizationRole[] = ["owner", "admin", "employee"];
const managers: readonly OrganizationRole[] = ["owner", "admin"];
export const FEATURE_CATALOG: Record<FeatureId, FeatureDefinition> = {
  "crm.basic": {
    label: "Clientes básicos",
    tier: "free",
    minimumVersion: 1,
    roles: members,
    status: "preview",
  },
  "agenda.local": {
    label: "Agenda local",
    tier: "free",
    minimumVersion: 1,
    roles: members,
    status: "preview",
  },
  "projects.basic": {
    label: "Seguimiento de trabajos",
    tier: "free",
    minimumVersion: 1,
    roles: members,
    status: "preview",
  },
  "quotes.basic": {
    label: "Presupuestos básicos",
    tier: "free",
    minimumVersion: 1,
    roles: members,
    status: "preview",
  },
  "profile.edit": {
    label: "Perfil del negocio",
    tier: "free",
    minimumVersion: 1,
    roles: managers,
    status: "preview",
  },
  "modules.configure": {
    label: "Configurar herramientas",
    tier: "free",
    minimumVersion: 1,
    roles: managers,
    status: "preview",
  },
  "crm.advanced": {
    label: "Gestión avanzada de clientes",
    tier: "suite",
    minimumVersion: 1,
    roles: members,
    status: "preview",
  },
  "projects.advanced": {
    label: "Proyectos: Kanban, tabla y calendario",
    tier: "suite",
    minimumVersion: 1,
    roles: members,
    status: "preview",
  },
  "quotes.advanced": {
    label: "Presupuestos y calculadoras avanzadas",
    tier: "suite",
    minimumVersion: 1,
    roles: members,
    status: "preview",
  },
  "analytics.advanced": {
    label: "Estadísticas avanzadas",
    tier: "suite",
    minimumVersion: 1,
    roles: managers,
    status: "preview",
  },
  "invoices.issue": {
    label: "Emisión de facturas reales",
    tier: "suite",
    minimumVersion: 1,
    roles: managers,
    status: "planned",
  },
  "ai.assistant": {
    label: "Inteligencia artificial conectada",
    tier: "suite",
    minimumVersion: 1,
    roles: members,
    status: "planned",
  },
};
export type AccessContext = {
  experience: "business" | "customer";
  role: OrganizationRole | null;
  plan: ProfessionalPlan;
  licenseVersion?: number;
  moduleEnabled?: boolean;
  platform?: LicensePlatform;
  licensePlatform?: LicensePlatform;
};
export type AccessDecision = {
  allowed: boolean;
  reason:
    | "allowed"
    | "planned"
    | "business-context"
    | "role"
    | "module-disabled"
    | "plan"
    | "license-version"
    | "platform"
    | "unknown-feature";
};
/** Policy prototype. This pure function is not authentication or a server authorization boundary. */
export function getFeatureAccess(
  context: AccessContext,
  feature: FeatureId,
): AccessDecision {
  if (!Object.hasOwn(FEATURE_CATALOG, feature))
    return { allowed: false, reason: "unknown-feature" };
  const definition = FEATURE_CATALOG[feature];
  if (definition.status === "planned")
    return { allowed: false, reason: "planned" };
  if (context.experience !== "business")
    return { allowed: false, reason: "business-context" };
  if (!context.role || !definition.roles.includes(context.role))
    return { allowed: false, reason: "role" };
  if (context.moduleEnabled === false)
    return { allowed: false, reason: "module-disabled" };
  if (definition.tier === "free") return { allowed: true, reason: "allowed" };
  if (context.plan !== "suite") return { allowed: false, reason: "plan" };
  if (
    !Number.isFinite(context.licenseVersion) ||
    context.licenseVersion! < definition.minimumVersion
  )
    return { allowed: false, reason: "license-version" };
  if (
    context.platform &&
    context.licensePlatform &&
    context.platform !== context.licensePlatform
  )
    return { allowed: false, reason: "platform" };
  return { allowed: true, reason: "allowed" };
}
