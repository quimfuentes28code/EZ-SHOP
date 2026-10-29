"use client";

import { useState } from "react";
import {
  ArrowDownUp,
  ArrowUpRight,
  CalendarDays,
  Camera,
  Check,
  ChevronRight,
  Clock3,
  FileText,
  FolderKanban,
  Image,
  Layers3,
  Package,
  Search,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { MODULES, type ModuleId } from "@/lib/catalog";
import { Modal } from "./modal";
import "./module-preview.css";

/** View adapters only: each domain keeps its own example data and semantics. */
type PreviewRow = {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  status: string;
  detail: string;
  initials?: string;
};

const customers = [
  {
    id: "C-001",
    name: "Laura Martínez",
    type: "Cliente particular",
    initials: "LM",
    relationship: "Activo",
    history: "3 servicios de ejemplo",
    note: "Relación de muestra exclusiva de este negocio. No hay una cuenta global vinculada.",
  },
  {
    id: "C-002",
    name: "NOVA Clothing",
    type: "Empresa · Comercio",
    initials: "NC",
    relationship: "Activo",
    history: "2 proyectos de ejemplo",
    note: "Empresa ficticia. Aquí se mostrarán los contactos autorizados de esta relación.",
  },
  {
    id: "C-003",
    name: "Marcos Vidal",
    type: "Cliente particular",
    initials: "MV",
    relationship: "Nuevo",
    history: "Primera solicitud",
    note: "Contacto de muestra sin datos personales ni comunicaciones enviadas.",
  },
  {
    id: "C-004",
    name: "Estudio Oliva",
    type: "Empresa · Diseño",
    initials: "EO",
    relationship: "Activo",
    history: "1 proyecto de ejemplo",
    note: "Los registros del negocio nunca dan acceso al historial del cliente en otras empresas.",
  },
];
const projects = [
  {
    id: "PR-024",
    title: "Campaña NOVA",
    client: "NOVA Clothing",
    stage: "En curso",
    due: "6 nov.",
    progress: 65,
    initials: "NC",
    note: "Selección y edición de piezas de la campaña. Los estados son ejemplos visuales.",
  },
  {
    id: "PR-025",
    title: "Identidad de producto",
    client: "Estudio Oliva",
    stage: "En revisión",
    due: "9 nov.",
    progress: 90,
    initials: "EO",
    note: "Material pendiente de revisión en esta demostración. No se han enviado entregables.",
  },
  {
    id: "PR-026",
    title: "Nuevo proyecto de marca",
    client: "Cliente de ejemplo",
    stage: "Por empezar",
    due: "12 nov.",
    progress: 10,
    initials: "CE",
    note: "Un ejemplo de la fase inicial de un proyecto, sin contratación ni acuerdos reales.",
  },
];
const quotes = [
  {
    id: "P-024",
    title: "Propuesta de campaña",
    client: "NOVA Clothing",
    amount: "750 €",
    stage: "Pendiente",
    note: "Importe ilustrativo. Esta propuesta no ha sido enviada ni tiene validez comercial.",
  },
  {
    id: "P-023",
    title: "Proyecto de producto",
    client: "Estudio Oliva",
    amount: "1.200 €",
    stage: "Aceptado",
    note: "Estado ficticio. No hay una aceptación contractual ni un cobro asociado.",
  },
  {
    id: "P-022",
    title: "Servicio personalizado",
    client: "Laura Martínez",
    amount: "280 €",
    stage: "Borrador",
    note: "Vista de una propuesta en preparación, sin generación de documentos reales.",
  },
];
const orders = [
  {
    id: "EN-032",
    item: "Encargo personalizado",
    customer: "Laura Martínez",
    collection: "6 nov. · 11:00",
    stage: "En preparación",
    note: "Ejemplo de un encargo pendiente de preparación. No se ha tramitado ningún pedido.",
  },
  {
    id: "EN-031",
    item: "Pedido para recoger",
    customer: "Marcos Vidal",
    collection: "6 nov. · 17:30",
    stage: "Listo para recoger",
    note: "La recogida mostrada es ficticia. No existe disponibilidad o confirmación real.",
  },
  {
    id: "EN-030",
    item: "Selección de temporada",
    customer: "Estudio Oliva",
    collection: "7 nov. · 10:00",
    stage: "Pendiente",
    note: "Pedido de ejemplo sin inventario, preparación ni envío conectado.",
  },
];
const team = [
  {
    id: "EQ-01",
    name: "Alex Moreno",
    initials: "AM",
    role: "Propietario · Demo",
    hours: "09:00 — 18:00",
    status: "Disponible",
  },
  {
    id: "EQ-02",
    name: "Clara Soler",
    initials: "CS",
    role: "Colaboradora · Demo",
    hours: "10:00 — 17:00",
    status: "Disponible",
  },
  {
    id: "EQ-03",
    name: "Dani Costa",
    initials: "DC",
    role: "Colaborador · Demo",
    hours: "09:00 — 14:00",
    status: "Fuera de horario",
  },
];
const galleryExamples = [
  {
    title: "Campaña NOVA",
    subtitle: "24 imágenes de muestra",
    stage: "En revisión",
    art: "nvm-art-studio",
  },
  {
    title: "Retratos de estudio",
    subtitle: "12 imágenes de muestra",
    stage: "Aprobada",
    art: "nvm-art-portrait",
  },
  {
    title: "Colección de producto",
    subtitle: "18 imágenes de muestra",
    stage: "Borrador",
    art: "nvm-art-product",
  },
];

const normalize = (value: string) =>
  value
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
const matches = (query: string, ...values: string[]) =>
  normalize(values.join(" ")).includes(normalize(query));
const tone = (status: string) =>
  /pendiente|borrador|empezar|preparación|fuera/i.test(status)
    ? "warning"
    : /revisión|nuevo/i.test(status)
      ? "blue"
      : "";

function exampleRows(id: ModuleId, sectorId: string): PreviewRow[] {
  switch (id) {
    case "customers":
      return customers.map((c) => ({
        id: c.id,
        title: c.name,
        subtitle: c.type,
        meta: c.history,
        status: c.relationship,
        detail: c.note,
        initials: c.initials,
      }));
    case "quotes":
      return quotes.map((q) => ({
        id: q.id,
        title: q.title,
        subtitle: q.client,
        meta: q.amount,
        status: q.stage,
        detail: q.note,
      }));
    case "orders":
      return orders.map((o) => ({
        id: o.id,
        title: o.item,
        subtitle: o.customer,
        meta: o.collection,
        status: o.stage,
        detail: o.note,
      }));
    case "staff":
      return team.map((t) => ({
        id: t.id,
        title: t.name,
        subtitle: t.role,
        meta: t.hours,
        status: t.status,
        initials: t.initials,
        detail:
          "Persona ficticia. El horario es ilustrativo: no hay membresías, permisos, invitaciones ni control de disponibilidad real.",
      }));
    case "bookings": {
      const photography = sectorId === "photo";
      const beauty = sectorId === "beauty";
      return [
        {
          id: "CI-014",
          title: photography
            ? "Sesión de retrato"
            : beauty
              ? "Corte y acabado"
              : "Cita de ejemplo",
          subtitle: "Laura Martínez",
          meta: "6 nov. · 10:00 — 11:00",
          status: "Confirmada",
          detail:
            "Cita ficticia, sin disponibilidad comprobada ni reserva enviada. La agenda real se construirá en un hito posterior.",
        },
        {
          id: "CI-015",
          title: photography
            ? "Sesión de producto"
            : beauty
              ? "Color y tratamiento"
              : "Servicio de ejemplo",
          subtitle: "Cliente de ejemplo",
          meta: "6 nov. · 12:30 — 13:30",
          status: "Pendiente",
          detail:
            "Solicitud de muestra. No se ha avisado al cliente ni reservado ningún recurso.",
        },
        {
          id: "CI-016",
          title: photography ? "Reunión de proyecto" : "Primera visita",
          subtitle: "Marcos Vidal",
          meta: "7 nov. · 16:00 — 16:30",
          status: "Confirmada",
          detail:
            "Franja de muestra en horario local de la demo. No es una confirmación real.",
        },
      ];
    }
    case "services":
      return [
        {
          id: "SV-01",
          title:
            sectorId === "photo"
              ? "Sesión de retrato"
              : sectorId === "beauty"
                ? "Corte y acabado"
                : "Servicio esencial",
          subtitle: "Servicio individual",
          meta: "60 min · Orientativo",
          status: "Visible en demo",
          detail:
            "Ficha de ejemplo sin contratación, tarifas vinculantes o disponibilidad conectada.",
        },
        {
          id: "SV-02",
          title:
            sectorId === "photo"
              ? "Fotografía de producto"
              : "Servicio personalizado",
          subtitle: "A medida",
          meta: "Según proyecto",
          status: "Visible en demo",
          detail:
            "Ejemplo de servicio cuya duración y alcance se definirán según el trabajo.",
        },
      ];
    case "products":
      return [
        {
          id: "PD-01",
          title:
            sectorId === "bakery"
              ? "Tarta de celebración"
              : "Producto de temporada",
          subtitle: "Catálogo de ejemplo",
          meta: "3 variantes",
          status: "Visible en demo",
          detail:
            "Producto ficticio sin stock real, venta ni pedido conectado.",
        },
        {
          id: "PD-02",
          title:
            sectorId === "bakery"
              ? "Selección de repostería"
              : "Colección esencial",
          subtitle: "Catálogo de ejemplo",
          meta: "2 variantes",
          status: "Borrador",
          detail:
            "Ficha de muestra. Las variantes se presentan para revisar la organización visual del catálogo.",
        },
      ];
    default:
      return [];
  }
}

function moduleIcon(id: ModuleId) {
  if (id === "customers" || id === "staff") return <UsersRound size={18} />;
  if (id === "bookings") return <CalendarDays size={18} />;
  if (id === "quotes") return <FileText size={18} />;
  if (id === "orders" || id === "products") return <Package size={18} />;
  return <Layers3 size={18} />;
}

export function ModulePreview({
  id,
  sectorId,
  query,
}: {
  id: ModuleId;
  sectorId: string;
  query: string;
}) {
  const [status, setStatus] = useState("all");
  const [detail, setDetail] = useState<PreviewRow | null>(null);
  const rows = exampleRows(id, sectorId);
  const statuses = Array.from(new Set(rows.map((row) => row.status)));
  const currentStatus = statuses.includes(status) ? status : "all";
  const visibleRows = rows.filter(
    (row) =>
      (currentStatus === "all" || row.status === currentStatus) &&
      matches(query, row.title, row.subtitle, row.meta, row.status, row.id),
  );

  if (id === "payments" || id === "invoices")
    return (
      <div className="empty-state">
        <ShieldCheck size={30} />
        <h3>Se incorporará en una fase posterior</h3>
        <p>Este prototipo no procesa cobros ni emite documentos fiscales.</p>
      </div>
    );

  return (
    <div className="nvm-preview">
      <div className="nvm-preview-caption">
        <span>
          <span className="nvm-live-dot" /> DATOS DE EJEMPLO
        </span>
        <p>
          Explora la estructura. Ninguna acción se envía a personas o negocios.
        </p>
      </div>
      {id === "projects" ? (
        <ProjectBoard query={query} onDetail={setDetail} />
      ) : id === "galleries" ? (
        <GalleryPreview query={query} onDetail={setDetail} />
      ) : rows.length > 0 ? (
        <>
          <div className="nvm-list-toolbar">
            <div>
              <strong>{visibleRows.length}</strong>
              <span>
                {id === "customers"
                  ? "relaciones de ejemplo"
                  : "registros de ejemplo"}
              </span>
            </div>
            <label className="nvm-status-filter">
              <ArrowDownUp size={13} />
              <span className="sr-only">Filtrar por estado</span>
              <select
                aria-label="Filtrar por estado"
                value={currentStatus}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="all">Todos los estados</option>
                {statuses.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {visibleRows.length ? (
            <div className="nvm-table-wrap">
              <table className="nvm-table">
                <thead>
                  <tr>
                    <th scope="col">
                      {id === "customers" || id === "staff"
                        ? "Nombre"
                        : "Concepto"}
                    </th>
                    <th scope="col">
                      {id === "quotes"
                        ? "Importe ilustrativo"
                        : id === "bookings" || id === "orders"
                          ? "Fecha de ejemplo"
                          : id === "staff"
                            ? "Horario de ejemplo"
                            : "Información"}
                    </th>
                    <th scope="col">Estado demo</th>
                    <th scope="col">
                      <span className="sr-only">Detalle</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row, index) => (
                    <tr key={row.id}>
                      <td>
                        <button
                          className="nvm-row-name"
                          onClick={() => setDetail(row)}
                        >
                          <span
                            className={`nvm-record-icon nvm-record-color-${index % 4}`}
                          >
                            {row.initials || moduleIcon(id)}
                          </span>
                          <span>
                            <strong>{row.title}</strong>
                            <small>{row.subtitle}</small>
                          </span>
                        </button>
                      </td>
                      <td>{row.meta}</td>
                      <td>
                        <span className={`status ${tone(row.status)}`}>
                          {row.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="nvm-row-detail"
                          aria-label={`Ver detalle de ${row.title}`}
                          onClick={() => setDetail(row)}
                        >
                          <ChevronRight size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <NoResults />
          )}
          <div className="nvm-list-bottom">
            <ShieldCheck size={13} />
            <span>
              {id === "customers"
                ? "Las relaciones mostradas pertenecen únicamente a este espacio de demostración."
                : "Vista previa visual · Sin operaciones reales ni datos de producción."}
            </span>
          </div>
        </>
      ) : (
        <FutureModule id={id} query={query} />
      )}
      {detail && (
        <Modal title={detail.title} onClose={() => setDetail(null)}>
          <div className="nvm-detail-id">
            <span>{detail.id}</span>
            <span className={`status ${tone(detail.status)}`}>
              {detail.status}
            </span>
          </div>
          <p className="nvm-detail-subtitle">{detail.subtitle}</p>
          <div className="nvm-detail-meta">
            <Clock3 size={16} />
            {detail.meta}
          </div>
          <p>{detail.detail}</p>
          <div className="notice">
            <ShieldCheck size={17} />
            <p>
              Registro ficticio. Esta vista no crea ni modifica servicios,
              solicitudes o cuentas reales.
            </p>
          </div>
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setDetail(null)}
            >
              Volver al módulo
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function NoResults() {
  return (
    <div className="empty-state nvm-no-results">
      <Search size={26} />
      <h3>No hay coincidencias</h3>
      <p>Prueba con otro nombre o cambia el filtro de estado.</p>
    </div>
  );
}

function ProjectBoard({
  query,
  onDetail,
}: {
  query: string;
  onDetail: (detail: PreviewRow) => void;
}) {
  const [filter, setFilter] = useState("all");
  const stages = ["Por empezar", "En curso", "En revisión"];
  const filtered = projects.filter(
    (project) =>
      (filter === "all" || project.stage === filter) &&
      matches(query, project.title, project.client, project.stage),
  );
  return (
    <>
      <div className="nvm-list-toolbar">
        <div>
          <FolderKanban size={16} />
          <span>Vista de proyectos</span>
        </div>
        <label className="nvm-status-filter">
          <ArrowDownUp size={13} />
          <select
            aria-label="Filtrar proyectos por estado"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="all">Todos los estados</option>
            {stages.map((stage) => (
              <option key={stage}>{stage}</option>
            ))}
          </select>
        </label>
      </div>
      {filtered.length ? (
        <div className="nvm-kanban">
          {stages
            .filter((stage) => filter === "all" || filter === stage)
            .map((stage) => (
              <section key={stage} className="nvm-kanban-column">
                <h3>
                  <span className={`nvm-stage-dot ${tone(stage)}`} />
                  {stage}
                  <span>
                    {
                      filtered.filter((project) => project.stage === stage)
                        .length
                    }
                  </span>
                </h3>
                {filtered
                  .filter((project) => project.stage === stage)
                  .map((project) => (
                    <button
                      key={project.id}
                      className="nvm-project-card"
                      onClick={() =>
                        onDetail({
                          id: project.id,
                          title: project.title,
                          subtitle: project.client,
                          meta: `Entrega de ejemplo · ${project.due}`,
                          status: project.stage,
                          detail: project.note,
                        })
                      }
                    >
                      <span className="nvm-project-id">
                        {project.id}
                        <ArrowUpRight size={13} />
                      </span>
                      <h4>{project.title}</h4>
                      <p>{project.client}</p>
                      <div className="nvm-project-progress">
                        <span style={{ width: `${project.progress}%` }} />
                      </div>
                      <div className="nvm-project-footer">
                        <span>
                          <CalendarDays size={12} />
                          {project.due}
                        </span>
                        <span className="nvm-project-avatar">
                          {project.initials}
                        </span>
                      </div>
                    </button>
                  ))}
              </section>
            ))}
        </div>
      ) : (
        <NoResults />
      )}
      <div className="nvm-list-bottom">
        <Check size={13} />
        <span>
          Estados y progreso ilustrativos. Abre una tarjeta para revisar su
          detalle.
        </span>
      </div>
    </>
  );
}

function GalleryPreview({
  query,
  onDetail,
}: {
  query: string;
  onDetail: (detail: PreviewRow) => void;
}) {
  const visible = galleryExamples.filter((gallery) =>
    matches(query, gallery.title, gallery.subtitle, gallery.stage),
  );
  return (
    <>
      {visible.length ? (
        <div className="nvm-galleries">
          {visible.map((gallery, index) => (
            <button
              key={gallery.title}
              className="nvm-gallery-card"
              onClick={() =>
                onDetail({
                  id: `GL-00${index + 1}`,
                  title: gallery.title,
                  subtitle: gallery.subtitle,
                  meta: "Composición visual · Sin archivos reales",
                  status: gallery.stage,
                  detail:
                    "Esta composición abstracta representa un espacio de entrega. No hay fotografías de clientes, archivos descargables ni aprobaciones reales.",
                })
              }
            >
              <div className={`nvm-gallery-art ${gallery.art}`}>
                <span />
                <span />
                <span />
                <Camera size={24} />
                <small>COMPOSICIÓN DE MUESTRA</small>
              </div>
              <div className="nvm-gallery-body">
                <div>
                  <h3>{gallery.title}</h3>
                  <ArrowUpRight size={15} />
                </div>
                <p>{gallery.subtitle}</p>
                <span className={`status ${tone(gallery.stage)}`}>
                  {gallery.stage}
                </span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <NoResults />
      )}
      <div className="nvm-list-bottom">
        <Image size={13} />
        <span>
          Composiciones abstractas. No se muestran fotografías ni archivos
          reales.
        </span>
      </div>
    </>
  );
}

function FutureModule({ id, query }: { id: ModuleId; query: string }) {
  const module = MODULES[id];
  return (
    <div className="nvm-future">
      <div className="nvm-future-window" aria-hidden="true">
        <div>
          <span />
          <span />
          <span />
        </div>
        <section>
          <span className="nvm-skeleton-short" />
          <span />
          <span />
          <span className="nvm-skeleton-medium" />
        </section>
        <aside>
          <span />
          <span />
          <span />
        </aside>
      </div>
      <span className="nvm-future-icon">
        <Layers3 size={25} />
      </span>
      <span className="tag">Espacio de demostración</span>
      <h3>
        {query.trim()
          ? "Este módulo todavía no contiene registros"
          : `${module.label}, a tu manera.`}
      </h3>
      <p>
        {module.desc}. Este espacio permite revisar cómo encaja la herramienta
        en el panel; los flujos operativos se desarrollarán en sus hitos
        correspondientes.
      </p>
      <div className="nvm-future-note">
        <ShieldCheck size={15} />
        <span>Sin datos reales, integraciones ni acciones enviadas.</span>
      </div>
    </div>
  );
}
