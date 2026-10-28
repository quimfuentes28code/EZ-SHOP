"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Blocks,
  CalendarDays,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Compass,
  FileText,
  FolderKanban,
  GalleryHorizontalEnd,
  LayoutDashboard,
  Menu,
  Package,
  Search,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { Modal } from "@/components/modal";
import { ModulePicker } from "@/components/module-picker";
import { ModulePreview } from "@/components/module-preview";
import { MODULES, sectorById, type ModuleId } from "@/lib/catalog";
import {
  DEFAULT_CONFIG,
  loadDemoConfig,
  normalizeDemoConfig,
  saveDemoConfig,
  type DemoConfig,
} from "@/lib/demo";
import "./workspace.css";

type View = "summary" | "modules" | ModuleId;
const icons: Partial<Record<ModuleId, LucideIcon>> = {
  customers: UsersRound,
  staff: UsersRound,
  services: Blocks,
  bookings: CalendarDays,
  capacity: CalendarDays,
  products: Package,
  stock: Package,
  orders: ShoppingBag,
  quotes: FileText,
  projects: FolderKanban,
  galleries: GalleryHorizontalEnd,
};
const dayLabels = [
  "Lunes, 2 de noviembre",
  "Martes, 3 de noviembre",
  "Miércoles, 4 de noviembre",
];

export default function BusinessPage() {
  const [config, setConfig] = useState<DemoConfig>(DEFAULT_CONFIG);
  const [view, setView] = useState<View>("summary");
  const [query, setQuery] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [notification, setNotification] = useState(false);
  const [help, setHelp] = useState(false);
  const [status, setStatus] = useState("");
  const [day, setDay] = useState(0);
  const [period, setPeriod] = useState<"week" | "month">("week");
  useEffect(() => {
    setConfig(loadDemoConfig());
  }, []);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 700px)");
    const sync = () => {
      setIsMobile(media.matches);
      if (!media.matches) setMobileNav(false);
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    if (!mobileNav) return;
    const sidebar = document.getElementById("business-navigation");
    const focusable = sidebar?.querySelectorAll<HTMLElement>(
      "a[href], button:not([disabled])",
    );
    focusable?.[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileNav(false);
        document.querySelector<HTMLElement>(".mobile-menu")?.focus();
      }
      if (event.key !== "Tab" || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = oldOverflow;
    };
  }, [mobileNav]);
  const current =
    view !== "summary" && view !== "modules" && !config.modules.includes(view)
      ? "summary"
      : view;
  const sector = sectorById(config.sectorId);
  const go = (next: View) => {
    setView(next);
    setQuery("");
    setMobileNav(false);
  };
  const updateModules = (modules: ModuleId[]) => {
    const updated = normalizeDemoConfig({ ...config, modules });
    setConfig(updated);
    setStatus(
      saveDemoConfig(updated)
        ? "Configuración guardada en este navegador."
        : "Cambios aplicados temporalmente. El navegador no permite guardarlos.",
    );
  };
  const primary = config.modules.includes("projects")
    ? "projects"
    : config.modules.includes("orders")
      ? "orders"
      : config.modules.includes("bookings")
        ? "bookings"
        : "customers";
  const primaryLabel = MODULES[primary].label;
  const operational = config.modules.filter((id) => id !== "customers");
  const projects = config.modules.includes("projects");
  const appointments =
    config.modules.includes("bookings") || config.modules.includes("capacity");
  const quotes = config.modules.includes("quotes");
  const title =
    current === "summary"
      ? "Resumen general"
      : current === "modules"
        ? "Tus módulos"
        : MODULES[current].label;

  return (
    <div className="workspace-shell">
      <a className="skip-link" href="#workspace-content">
        Saltar al contenido
      </a>
      {mobileNav && (
        <button
          className="sidebar-scrim"
          aria-label="Cerrar menú"
          onClick={() => setMobileNav(false)}
        />
      )}
      <aside
        className={`workspace-sidebar ${mobileNav ? "is-open" : ""}`}
        id="business-navigation"
        inert={isMobile && !mobileNav}
      >
        <div className="workspace-logo">
          <Brand />
          <span className="demo-badge">DEMO</span>
          <button
            className="icon-button sidebar-close"
            aria-label="Cerrar menú"
            onClick={() => setMobileNav(false)}
          >
            <X size={17} />
          </button>
        </div>
        <Link className="business-switcher" href="/onboarding">
          <span className="business-monogram">
            {config.name.substring(0, 1)}
          </span>
          <span>
            <strong>{config.name}</strong>
            <small>Espacio de empresa</small>
          </span>
          <ChevronDown size={14} />
        </Link>
        <span className="workspace-nav-label">WORKSPACE</span>
        <nav aria-label="Módulos del negocio">
          <button
            className={`workspace-nav-item ${current === "summary" ? "is-active" : ""}`}
            onClick={() => go("summary")}
          >
            <LayoutDashboard size={17} />
            Resumen general
            <span className="active-dot" />
          </button>
          {config.modules.map((id) => {
            const Icon = icons[id] ?? Blocks;
            return (
              <button
                key={id}
                aria-label={MODULES[id].label}
                className={`workspace-nav-item ${current === id ? "is-active" : ""}`}
                onClick={() => go(id)}
              >
                <Icon size={17} />
                {MODULES[id].label}
                {id === "projects" && <span className="nav-count">8</span>}
              </button>
            );
          })}
        </nav>
        <div className="workspace-navigation-extra">
          <span className="workspace-nav-label">TU ESPACIO</span>
          <button
            aria-label="Módulos"
            className={`workspace-nav-item ${current === "modules" ? "is-active" : ""}`}
            onClick={() => go("modules")}
          >
            <Blocks size={17} />
            Módulos<span className="nav-new">NEW</span>
          </button>
          <Link className="workspace-nav-item" href="/onboarding">
            <Settings2 size={17} />
            Configuración
          </Link>
        </div>
        <div className="workspace-sidebar-bottom">
          <div className="sidebar-promo">
            <span>
              <Sparkles size={16} /> Crece a tu manera
            </span>
            <p>Tu próximo paso empieza con las herramientas adecuadas.</p>
            <button onClick={() => go("modules")}>
              Explorar módulos <ArrowUpRight size={13} />
            </button>
          </div>
          <button className="workspace-nav-item" onClick={() => setHelp(true)}>
            <CircleHelp size={17} />
            Ayuda y primeros pasos
            <ArrowUpRight size={13} />
          </button>
          <Link href="/cliente" className="account-switch">
            <span className="avatar avatar-person">AL</span>
            <span>
              <strong>Alex López</strong>
              <small>Ver mi espacio cliente</small>
            </span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </aside>
      <div className="workspace-body">
        <header className="workspace-topbar">
          <div className="workspace-breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label="Abrir menú"
              aria-expanded={mobileNav}
              aria-controls="business-navigation"
              onClick={() => setMobileNav(true)}
            >
              <Menu size={18} />
            </button>
            <span>Mi espacio</span>
            <ChevronRight size={12} />
            <strong>{title}</strong>
          </div>
          <div className="workspace-toolbar">
            <Link className="workspace-explore" href="/explorar">
              <Compass size={15} />
              Explorar Nexo
              <ArrowUpRight size={11} />
            </Link>
            <span className="toolbar-divider" />
            <button
              className="icon-button notification-button"
              aria-label="Notificaciones de demostración"
              aria-expanded={notification}
              onClick={() => setNotification(!notification)}
            >
              <Bell size={17} />
              <i />
            </button>
            <span
              className="avatar avatar-person"
              aria-label="Alex López, usuario ficticio"
            >
              AL
            </span>
          </div>
          {notification && (
            <section className="notification-popover">
              <div>
                <strong>Tu actividad, al día</strong>
                <button
                  className="icon-button"
                  aria-label="Cerrar notificaciones"
                  onClick={() => setNotification(false)}
                >
                  <X size={14} />
                </button>
              </div>
              <p>
                <span className="notification-dot" /> Una nueva solicitud de
                ejemplo espera tu revisión.
              </p>
              <p>
                <Check size={13} /> Tu espacio demo está preparado.
              </p>
              <small>Notificaciones ficticias · No se envían mensajes</small>
            </section>
          )}
        </header>
        <main className="workspace-content" id="workspace-content">
          <div className="workspace-page-heading">
            <div>
              <div className="workspace-overline">
                <span className="live-dot" /> TU NEGOCIO, CONECTADO{" "}
                <span className="workspace-sample-label">Datos de ejemplo</span>
              </div>
              <h1>
                {current === "summary" ? (
                  <>
                    Todo en orden.
                    <br className="mobile-only" /> Hola, Alex{" "}
                    <span className="greeting-spark" aria-hidden="true">
                      ✳
                    </span>
                  </>
                ) : (
                  title
                )}
              </h1>
              <p>
                {current === "summary"
                  ? "Un vistazo a lo que está pasando en tu negocio."
                  : current === "modules"
                    ? `Un espacio a medida para ${sector.label.toLocaleLowerCase("es")}.`
                    : MODULES[current].desc}
              </p>
            </div>
            <div className="workspace-heading-action">
              {current === "summary" ? (
                <button
                  className="button secondary"
                  onClick={() => go("modules")}
                >
                  <Settings2 size={14} />
                  Personalizar panel
                </button>
              ) : (
                <button
                  className="button secondary"
                  onClick={() => go("summary")}
                >
                  <ArrowDownLeft size={14} />
                  Volver al resumen
                </button>
              )}
            </div>
          </div>
          {current === "summary" ? (
            <>
              <section className="welcome-banner">
                <div className="welcome-symbol">
                  <Camera size={25} strokeWidth={1.2} />
                </div>
                <div>
                  <span>TU ESPACIO, A TU MANERA</span>
                  <h2>{config.name}, todo empieza aquí.</h2>
                  <p>
                    {config.modules.length} módulos conectados para que te
                    centres en lo que mejor haces.
                  </p>
                </div>
                <button
                  className="button primary small"
                  onClick={() => go(primary)}
                >
                  Ver {primaryLabel.toLocaleLowerCase("es")}{" "}
                  <ArrowUpRight size={14} />
                </button>
                <div className="banner-rings" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </div>
              </section>
              <section
                className="workspace-metrics"
                aria-label="Indicadores ficticios del negocio"
              >
                <Metric
                  label="Clientes conectados"
                  value="128"
                  change="+8 este mes"
                  icon={UsersRound}
                  onClick={() => go("customers")}
                  color="lime"
                />
                <Metric
                  label={
                    projects
                      ? "Proyectos en marcha"
                      : config.modules.includes("orders")
                        ? "Pedidos en marcha"
                        : "Módulos conectados"
                  }
                  value={
                    projects
                      ? "08"
                      : config.modules.includes("orders")
                        ? "12"
                        : String(config.modules.length).padStart(2, "0")
                  }
                  change={
                    projects ? "3 en fase de entrega" : "Tu espacio a medida"
                  }
                  icon={projects ? FolderKanban : Blocks}
                  onClick={() =>
                    go(
                      projects
                        ? "projects"
                        : config.modules.includes("orders")
                          ? "orders"
                          : "modules",
                    )
                  }
                  color="violet"
                />
                <Metric
                  label={
                    quotes ? "Presupuestos abiertos" : "Relaciones activas"
                  }
                  value={quotes ? "06" : "18"}
                  change={quotes ? "2 por revisar" : "Datos de demostración"}
                  icon={quotes ? FileText : Activity}
                  onClick={() => go(quotes ? "quotes" : "customers")}
                  color="orange"
                />
                <Metric
                  label={
                    appointments
                      ? "Próximas reservas"
                      : "Herramientas disponibles"
                  }
                  value={appointments ? "12" : "23"}
                  change={
                    appointments ? "4 esta semana" : "Combina y personaliza"
                  }
                  icon={CalendarDays}
                  onClick={() =>
                    go(
                      appointments
                        ? config.modules.includes("bookings")
                          ? "bookings"
                          : "capacity"
                        : "modules",
                    )
                  }
                  color="blue"
                />
              </section>
              <div className="workspace-dashboard-grid">
                <section className="workspace-card activity-card">
                  <div className="workspace-card-header">
                    <div>
                      <h2>El pulso de tu negocio</h2>
                      <p>Actividad ilustrativa · No son ingresos</p>
                    </div>
                    <div
                      className="chart-period"
                      aria-label="Periodo del gráfico"
                    >
                      <button
                        className={period === "week" ? "active" : ""}
                        aria-pressed={period === "week"}
                        onClick={() => setPeriod("week")}
                      >
                        Semana
                      </button>
                      <button
                        className={period === "month" ? "active" : ""}
                        aria-pressed={period === "month"}
                        onClick={() => setPeriod("month")}
                      >
                        Mes
                      </button>
                    </div>
                  </div>
                  <div className="activity-total">
                    <strong>{period === "week" ? "42" : "168"}</strong>
                    <span>
                      interacciones de ejemplo <small>↗ 18,2 %</small>
                    </span>
                  </div>
                  <ActivityChart period={period} />
                  <div className="chart-footer">
                    <span>
                      <i /> Contactos
                    </span>
                    <span>
                      <i /> Acciones
                    </span>
                    <small>
                      {period === "week"
                        ? "2–8 noviembre 2026"
                        : "Noviembre 2026"}{" "}
                      · Muestra
                    </small>
                  </div>
                </section>
                <section className="workspace-card agenda-card">
                  <div className="workspace-card-header">
                    <h2>{appointments ? "En tu agenda" : "Tu próximo paso"}</h2>
                    {appointments ? (
                      <button
                        className="plain-link"
                        onClick={() =>
                          go(
                            config.modules.includes("bookings")
                              ? "bookings"
                              : "capacity",
                          )
                        }
                      >
                        Ver todo <ArrowUpRight size={12} />
                      </button>
                    ) : (
                      <Blocks size={17} />
                    )}
                  </div>
                  {appointments ? (
                    <>
                      <div className="agenda-date">
                        <CalendarDays size={13} />
                        <span>{dayLabels[day]}</span>
                        <div>
                          <button
                            className="icon-button"
                            aria-label="Día anterior"
                            disabled={day === 0}
                            onClick={() => setDay(day - 1)}
                          >
                            <ChevronLeft size={13} />
                          </button>
                          <button
                            className="icon-button"
                            aria-label="Día siguiente"
                            disabled={day === 2}
                            onClick={() => setDay(day + 1)}
                          >
                            <ChevronRight size={13} />
                          </button>
                        </div>
                      </div>
                      {(config.sectorId === "photo"
                        ? [
                            {
                              time: "09:30",
                              duration: "60 min",
                              title: "Sesión de marca personal",
                              name: "Laura Martínez",
                              color: "lime",
                            },
                            {
                              time: "12:00",
                              duration: "45 min",
                              title: "Reunión de proyecto",
                              name: "Equipo NOVA",
                              color: "violet",
                            },
                            {
                              time: "16:30",
                              duration: "90 min",
                              title: "Fotografía de producto",
                              name: "Clara Torres",
                              color: "orange",
                            },
                          ]
                        : [
                            {
                              time: "09:30",
                              duration: "45 min",
                              title: "Primera atención",
                              name: "Laura Martínez",
                              color: "lime",
                            },
                            {
                              time: "12:00",
                              duration: "60 min",
                              title: "Servicio de ejemplo",
                              name: "Clara Torres",
                              color: "violet",
                            },
                            {
                              time: "16:30",
                              duration: "30 min",
                              title: "Seguimiento de solicitud",
                              name: "Alex Ruiz",
                              color: "orange",
                            },
                          ]
                      )
                        .slice(day === 2 ? 1 : 0, day === 1 ? 2 : 3)
                        .map((item) => (
                          <button
                            className="agenda-item"
                            key={item.time}
                            onClick={() =>
                              go(
                                config.modules.includes("bookings")
                                  ? "bookings"
                                  : "capacity",
                              )
                            }
                          >
                            <span className="agenda-time">
                              {item.time}
                              <small>{item.duration}</small>
                            </span>
                            <i className={item.color} />
                            <span>
                              <strong>{item.title}</strong>
                              <small>{item.name}</small>
                            </span>
                            <ChevronRight size={13} />
                          </button>
                        ))}
                      <div className="agenda-footer">
                        <span className="live-dot" /> Semana de ejemplo · Sin
                        reservas reales
                      </div>
                    </>
                  ) : (
                    <div className="next-step-content">
                      <span>
                        <Sparkles size={27} />
                      </span>
                      <h3>Tu negocio no tiene por qué funcionar con citas.</h3>
                      <p>
                        Explora los módulos que encajan con tus operaciones.
                      </p>
                      <button
                        className="button secondary small"
                        onClick={() => go("modules")}
                      >
                        Descubrir herramientas <ArrowRight size={14} />
                      </button>
                    </div>
                  )}
                </section>
              </div>
              <div className="workspace-bottom-grid">
                <section className="workspace-card projects-card">
                  <div className="workspace-card-header">
                    <div>
                      <h2>
                        {projects
                          ? "Proyectos en movimiento"
                          : "Tus herramientas, conectadas"}
                      </h2>
                      <p>
                        {projects
                          ? "Cada detalle, un paso más cerca."
                          : "Accede a lo que necesitas para tu actividad."}
                      </p>
                    </div>
                    <button className="plain-link" onClick={() => go(primary)}>
                      Ver {primaryLabel.toLocaleLowerCase("es")}{" "}
                      <ArrowUpRight size={12} />
                    </button>
                  </div>
                  {projects ? (
                    <div className="project-table-wrap">
                      <table className="project-table">
                        <thead>
                          <tr>
                            <th>PROYECTO</th>
                            <th>ESTADO</th>
                            <th>PROGRESO</th>
                            <th>ENTREGA</th>
                            <th>
                              <span className="sr-only">Detalles</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            {
                              title: "Identidad de marca · NOVA",
                              client: "NOVA Clothing",
                              status: "En edición",
                              progress: 65,
                              color: "violet",
                              date: "06 nov.",
                            },
                            {
                              title: "Retratos para un nuevo comienzo",
                              client: "Laura Martínez",
                              status: "En revisión",
                              progress: 85,
                              color: "orange",
                              date: "09 nov.",
                            },
                            {
                              title: "Campaña de temporada",
                              client: "Estudio Olive",
                              status: "Planificación",
                              progress: 25,
                              color: "lime",
                              date: "12 nov.",
                            },
                          ].map((project, i) => (
                            <tr key={project.title}>
                              <td>
                                <span
                                  className={`project-icon ${project.color}`}
                                >
                                  <Camera size={17} />
                                </span>
                                <span>
                                  <strong>{project.title}</strong>
                                  <small>{project.client}</small>
                                </span>
                              </td>
                              <td>
                                <span
                                  className={`status ${i === 0 ? "blue" : i === 1 ? "warning" : ""}`}
                                >
                                  <i />
                                  {project.status}
                                </span>
                              </td>
                              <td>
                                <div className="project-progress">
                                  <span>
                                    <i
                                      style={{ width: `${project.progress}%` }}
                                    />
                                  </span>
                                  <small>{project.progress}%</small>
                                </div>
                              </td>
                              <td>{project.date}</td>
                              <td>
                                <button
                                  className="icon-button"
                                  aria-label={`Ver ${project.title}`}
                                  onClick={() => go("projects")}
                                >
                                  <ChevronRight size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="connected-modules">
                      {(operational.length
                        ? operational
                        : ["customers" as const]
                      )
                        .slice(0, 4)
                        .map((id) => {
                          const Icon = icons[id] ?? Blocks;
                          return (
                            <button key={id} onClick={() => go(id)}>
                              <Icon size={20} />
                              <span>
                                <strong>{MODULES[id].label}</strong>
                                <small>{MODULES[id].desc}</small>
                              </span>
                              <ArrowUpRight size={14} />
                            </button>
                          );
                        })}
                    </div>
                  )}
                </section>
                <section className="workspace-card quick-card">
                  <div className="workspace-card-header">
                    <h2>Hazlo tuyo</h2>
                    <Sparkles size={16} />
                  </div>
                  <div className="quick-art" aria-hidden="true">
                    <span>
                      <Blocks size={24} />
                    </span>
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>
                  <h3>
                    Tu negocio evoluciona.
                    <br />
                    Tu espacio también.
                  </h3>
                  <p>
                    Activa nuevas herramientas cuando las necesites. Sin empezar
                    de cero.
                  </p>
                  <button onClick={() => go("modules")}>
                    Personalizar mis módulos <ArrowRight size={14} />
                  </button>
                </section>
              </div>
            </>
          ) : current === "modules" ? (
            <section className="workspace-module-settings">
              <div className="module-settings-banner">
                <span className="module-banner-icon">
                  <Blocks size={25} />
                </span>
                <div>
                  <h2>Lo que necesitas. Nada de más.</h2>
                  <p>
                    Activa una herramienta y aparecerá en tu menú. Clientes
                    siempre viene incluido.
                  </p>
                </div>
                <Link href="/onboarding" className="button secondary small">
                  Cambiar de sector <ArrowUpRight size={14} />
                </Link>
              </div>
              <div className="workspace-storage-status" role="status">
                {status ||
                  "Los cambios se guardan automáticamente sólo en este navegador."}
              </div>
              <ModulePicker
                modules={config.modules}
                onChange={updateModules}
                sectorId={config.sectorId}
              />
            </section>
          ) : (
            <>
              <label className="module-search">
                <Search size={16} />
                <input
                  aria-label="Buscar en este módulo"
                  placeholder={`Buscar en ${MODULES[current].label.toLocaleLowerCase("es")}…`}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              <ModulePreview
                key={current}
                id={current}
                sectorId={config.sectorId}
                query={query}
              />
            </>
          )}
          <footer className="workspace-footer">
            <span>
              <ShieldCheck size={12} /> Espacio de demostración · Todos los
              datos son ficticios
            </span>
            <span>
              Hecho para tu forma de trabajar{" "}
              <span className="footer-asterisk">✳</span>
            </span>
          </footer>
        </main>
      </div>
      {help && (
        <Modal
          title="Bienvenido a tu espacio Nexo"
          onClose={() => setHelp(false)}
        >
          <p>
            Esta es una demo visual del Hito 0. Puedes explorar los módulos,
            cambiar de sector y ver la cuenta de cliente.
          </p>
          <div className="notice">
            <ShieldCheck size={20} />
            <p>
              No hay cuentas, cobros ni reservas reales. La configuración de tu
              empresa sólo se guarda en este navegador.
            </p>
          </div>
          <div className="modal-actions">
            <Link className="button secondary" href="/onboarding">
              Configurar negocio
            </Link>
            <button className="button primary" onClick={() => setHelp(false)}>
              Entendido <Check size={14} />
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  change,
  icon: Icon,
  onClick,
  color,
}: {
  label: string;
  value: string;
  change: string;
  icon: LucideIcon;
  onClick: () => void;
  color: string;
}) {
  return (
    <button className="workspace-metric" onClick={onClick}>
      <div>
        <span className={`metric-symbol ${color}`}>
          <Icon size={17} />
        </span>
        <ArrowUpRight size={14} />
      </div>
      <span className="metric-label">{label}</span>
      <strong>{value}</strong>
      <small>
        <span>↗</span>
        {change}
      </small>
    </button>
  );
}

function ActivityChart({ period }: { period: "week" | "month" }) {
  const contacts =
    period === "week"
      ? [9, 17, 12, 23, 16, 27, 21]
      : [15, 22, 18, 29, 25, 33, 31];
  const actions =
    period === "week"
      ? [5, 10, 8, 14, 11, 19, 15]
      : [10, 15, 12, 20, 18, 26, 23];
  const labels =
    period === "week"
      ? ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
      : ["1–4", "5–8", "9–12", "13–16", "17–20", "21–24", "25–30"];
  return (
    <div
      className="activity-chart"
      role="img"
      aria-label={`Gráfico de demostración: ${period === "week" ? "42 interacciones semanales" : "168 interacciones mensuales"}. Contactos y acciones ilustrativos.`}
    >
      <div className="chart-y-axis">
        <span>40</span>
        <span>30</span>
        <span>20</span>
        <span>10</span>
        <span>0</span>
      </div>
      <div className="chart-plot">
        <div className="chart-grid-lines">
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className="chart-bar-groups">
          {contacts.map((value, i) => (
            <div className="chart-bar-group" key={labels[i]}>
              <div>
                <span style={{ height: `${value * 2.8}%` }} />
                <span style={{ height: `${actions[i] * 2.8}%` }} />
              </div>
              <small>{labels[i]}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
