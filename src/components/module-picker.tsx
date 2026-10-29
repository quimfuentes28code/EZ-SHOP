"use client";

import {
  CalendarDays,
  ChartNoAxesCombined,
  Check,
  FileText,
  FolderKanban,
  GalleryHorizontalEnd,
  GraduationCap,
  House,
  Layers3,
  MapPin,
  MessageSquare,
  Package,
  ShoppingBag,
  Ticket,
  Truck,
  UsersRound,
  WalletCards,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import {
  MODULES,
  isPreviewModule,
  sectorById,
  type ModuleId,
} from "@/lib/catalog";
import "./onboarding.css";

const moduleIcons: Partial<Record<ModuleId, LucideIcon>> = {
  customers: UsersRound,
  staff: UsersRound,
  locations: MapPin,
  services: Layers3,
  products: Package,
  bookings: CalendarDays,
  capacity: CalendarDays,
  resources: House,
  orders: ShoppingBag,
  stock: Package,
  quotes: FileText,
  projects: FolderKanban,
  workOrders: Wrench,
  galleries: GalleryHorizontalEnd,
  memberships: WalletCards,
  classes: GraduationCap,
  rentals: Package,
  stays: House,
  transport: Truck,
  tickets: Ticket,
  properties: House,
  contracts: FileText,
  communications: MessageSquare,
  payments: WalletCards,
  invoices: ChartNoAxesCombined,
};

export function ModulePicker({
  modules,
  onChange,
  sectorId,
}: {
  modules: ModuleId[];
  onChange: (modules: ModuleId[]) => void;
  sectorId: string;
}) {
  const suggested = sectorById(sectorId).suggested;
  const toggle = (id: ModuleId) => {
    if (id === "customers" || !isPreviewModule(id)) return;
    const updated = modules.includes(id)
      ? modules.filter((module) => module !== id)
      : [...modules, id];
    onChange(
      Array.from(new Set<ModuleId>(["customers", ...updated])).filter(
        isPreviewModule,
      ),
    );
  };

  return (
    <div className="nx-module-picker">
      <div className="nx-module-legend">
        <span>
          <i /> Seleccionado
        </span>
        <span>
          {modules.filter(isPreviewModule).length} módulos en tu espacio
        </span>
      </div>
      <div className="nx-module-grid">
        {(
          Object.entries(MODULES) as [ModuleId, (typeof MODULES)[ModuleId]][]
        ).map(([id, meta]) => {
          const active = id === "customers" || modules.includes(id);
          const planned = !isPreviewModule(id);
          const Icon = moduleIcons[id] ?? Layers3;
          return (
            <button
              key={id}
              type="button"
              className={`nx-module-card ${active && !planned ? "is-active" : ""} ${planned ? "is-planned" : ""}`}
              onClick={() => toggle(id)}
              disabled={id === "customers" || planned}
              aria-pressed={active && !planned}
              aria-label={
                id === "customers"
                  ? "Clientes, módulo base incluido"
                  : planned
                    ? `${meta.label}, próximamente`
                    : `${active ? "Desactivar" : "Activar"} ${meta.label}`
              }
            >
              <span className="nx-module-icon">
                <Icon size={19} strokeWidth={1.6} />
              </span>
              <span className="nx-module-copy">
                <strong>{meta.label}</strong>
                <small>{meta.desc}</small>
                <em>
                  {planned
                    ? "Próximamente"
                    : id === "customers"
                      ? "Base incluida"
                      : suggested.includes(id)
                        ? "Recomendado para tu actividad"
                        : meta.group}
                </em>
              </span>
              <span className="nx-module-check" aria-hidden="true">
                {active && !planned && <Check size={13} strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>
      <p className="nx-fineprint">
        Todos los módulos son vistas de demostración. Cobros y facturación
        quedan fuera de este hito.
      </p>
    </div>
  );
}
