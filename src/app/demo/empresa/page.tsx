"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Blocks,
  CalendarDays,
  Camera,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  FileText,
  FolderKanban,
  ImagePlus,
  LayoutDashboard,
  Menu,
  MessageCircle,
  Package,
  Search,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  Store,
  Crown,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { Modal } from "@/components/modal";
import { ModulePicker } from "@/components/module-picker";
import { ModulePreview } from "@/components/module-preview";
import { BusinessProfileEditor } from "@/features/business-profile/components";
import {
  DEMO_REQUEST_EVENT,
  getBusinessIdForSector,
  getDemoRequests,
  type DemoRequest,
} from "@/features/business-profile/model";
import { MODULES, sectorById, type ModuleId } from "@/lib/catalog";
import {
  DEFAULT_CONFIG,
  loadDemoConfig,
  normalizeDemoConfig,
  saveDemoConfig,
  type DemoConfig,
} from "@/lib/demo";
import {
  ExperienceSwitcher,
  OrganizationSwitcher,
} from "@/components/experience-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { ORGANIZATION_EVENT, loadActiveOrganization } from "@/lib/experience";
import "@/app/empresa/workspace.css";

type View = "summary" | "modules" | "profile" | ModuleId;
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
};
// Public photos and products live in the profile; private deliveries live in chat.
const profileModules = new Set<ModuleId>(["services", "products"]);
const chatModules = new Set<ModuleId>(["galleries", "communications"]);

export default function BusinessPage() {
  const [config, setConfig] = useState<DemoConfig>(DEFAULT_CONFIG);
  const [view, setView] = useState<View>("summary");
  const [query, setQuery] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [help, setHelp] = useState(false);
  const [status, setStatus] = useState("");
  const [requests, setRequests] = useState<DemoRequest[]>([]);
  useEffect(() => {
    setConfig(loadDemoConfig());
    const initial = new URLSearchParams(window.location.search).get("vista");
    if (initial === "perfil") setView("profile");
    if (initial === "modulos") setView("modules");
    const refresh = () => setRequests(getDemoRequests());
    const reloadBusiness = () => {
      setConfig(loadDemoConfig());
      setView("summary");
    };
    window.addEventListener(ORGANIZATION_EVENT, reloadBusiness);
    refresh();
    window.addEventListener(DEMO_REQUEST_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(ORGANIZATION_EVENT, reloadBusiness);
      window.removeEventListener(DEMO_REQUEST_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
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
  const closeMenu = () => {
    setMobileNav(false);
    document.querySelector<HTMLElement>(".mobile-menu")?.focus();
  };
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
      const first = focusable[0],
        last = focusable[focusable.length - 1];
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
    view !== "summary" &&
    view !== "modules" &&
    view !== "profile" &&
    !config.modules.includes(view)
      ? "summary"
      : view;
  const businessId = getBusinessIdForSector(config.sectorId);
  const chatHref = `/mensajes?como=empresa&negocio=${businessId}`;
  const publicHref = `/negocio/${businessId}`;
  const sector = sectorById(config.sectorId);
  const go = (next: View) => {
    setView(next);
    setQuery("");
    setMobileNav(false);
    if (isMobile)
      requestAnimationFrame(() =>
        document.getElementById("workspace-title")?.focus(),
      );
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
  const updateProfileIdentity = (patch: Partial<DemoConfig>) => {
    const updated = normalizeDemoConfig({ ...config, ...patch });
    const saved = saveDemoConfig(updated);
    setConfig(updated);
    return saved;
  };
  const optionalModules = config.modules.filter(
    (id) =>
      id !== "customers" && !profileModules.has(id) && !chatModules.has(id),
  );
  const ownRequests = requests.filter(
    (request) => request.businessId === businessId,
  );
  const title =
    current === "summary"
      ? "Inicio"
      : current === "modules"
        ? "Tus módulos"
        : current === "profile"
          ? "Mi perfil de negocio"
          : MODULES[current].label;
  const conversations =
    businessId === "photo"
      ? [
          {
            id: "lumen-alex",
            initials: "AL",
            name: "Alex López",
            subject: "Sesión de retrato",
            detail: "Habla de la sesión y comparte los archivos aquí.",
          },
          {
            id: "lumen-clara",
            initials: "CT",
            name: "Clara Torres",
            subject: "Fotografía de producto",
            detail: "Una conversación para todo el trabajo.",
          },
        ]
      : [
          {
            id: `${businessId === "beauty" ? "barberia" : businessId === "bakery" ? "dulce" : "taller"}-alex`,
            initials: "AL",
            name: "Alex López",
            subject: "Consulta de ejemplo",
            detail: "Responde preguntas y comparte información.",
          },
        ];

  return (
    <div className="workspace-shell">
      <a className="skip-link" href="#workspace-content">
        Saltar al contenido
      </a>
      {mobileNav && (
        <button
          className="sidebar-scrim"
          aria-label="Cerrar menú"
          onClick={closeMenu}
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
            onClick={closeMenu}
          >
            <X size={17} />
          </button>
        </div>
        <OrganizationSwitcher name={config.name} />
        <nav aria-label="Módulos del negocio">
          <span className="workspace-nav-label">LO ESENCIAL</span>
          <NavButton
            active={current === "summary"}
            onClick={() => go("summary")}
            icon={LayoutDashboard}
            label="Inicio"
          />
          <Link className="workspace-nav-item" href={chatHref}>
            <MessageCircle size={18} />
            Mensajes<span className="nav-hint">Archivos</span>
          </Link>
          <NavButton
            active={current === "customers"}
            onClick={() => go("customers")}
            icon={UsersRound}
            label="Clientes"
          />
          <NavButton
            active={current === "profile"}
            onClick={() => go("profile")}
            icon={Store}
            label="Mi perfil"
          />
          {optionalModules.length > 0 && (
            <div className="optional-navigation">
              <span className="workspace-nav-label">TUS HERRAMIENTAS</span>
              {optionalModules.map((id) => (
                <NavButton
                  key={id}
                  active={current === id}
                  onClick={() => go(id)}
                  icon={icons[id] ?? Blocks}
                  label={MODULES[id].label}
                />
              ))}
            </div>
          )}
        </nav>
        <div className="workspace-sidebar-bottom">
          <Link className="workspace-nav-item" href="/mi-plan">
            <Crown size={18} />
            Mi plan<span className="nav-hint">Gratis</span>
          </Link>
          <button
            className={`workspace-nav-item ${current === "modules" ? "is-active" : ""}`}
            aria-label="Módulos"
            onClick={() => go("modules")}
          >
            <Settings2 size={18} />
            Personalizar herramientas
          </button>
          <button className="workspace-nav-item" onClick={() => setHelp(true)}>
            <CircleHelp size={18} />
            Cómo funciona
          </button>
          <Link href="/demo/cliente" className="account-switch">
            <span className="avatar avatar-person">AL</span>
            <span>
              <strong>Modo cliente</strong>
              <small>Explorar la otra experiencia</small>
            </span>
            <ArrowRight size={15} />
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
              <Menu size={20} />
            </button>
            <span>Mi negocio</span>
            <ChevronRight size={13} />
            <strong>{title}</strong>
          </div>
          <div className="workspace-header-actions">
            <ExperienceSwitcher />
            <ThemeToggle />
            <Link
              href={publicHref}
              className="button secondary small"
              aria-label="Ver perfil como cliente"
            >
              <Store size={15} />
              <span>Ver perfil</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </header>
        <main className="workspace-content" id="workspace-content">
          <div className="workspace-page-heading">
            <div>
              <span className="eyebrow">ESPACIO DE NEGOCIO · DEMO</span>
              <h1 id="workspace-title" tabIndex={-1}>
                {current === "summary" ? "Tu negocio, más sencillo." : title}
              </h1>
              <p>
                {current === "summary"
                  ? "Habla con tus clientes, comparte tu trabajo y enseña lo que haces."
                  : current === "modules"
                    ? "Activa sólo las herramientas que vayas a usar."
                    : current === "profile"
                      ? "Las fotos, servicios y productos que verán tus clientes."
                      : MODULES[current].desc}
              </p>
            </div>
            {current !== "summary" && (
              <button
                className="button secondary small"
                onClick={() => go("summary")}
              >
                Volver a inicio <ArrowRight size={14} />
              </button>
            )}
          </div>
          {current === "summary" ? (
            <>
              <section
                className="essential-actions"
                aria-label="Acciones principales"
              >
                <Link href={chatHref}>
                  <span className="essential-icon">
                    <MessageCircle size={25} />
                  </span>
                  <h2>Hablar con un cliente</h2>
                  <p>Mensajes y archivos en la misma conversación.</p>
                  <span className="essential-link">
                    Abrir mensajes <ArrowRight size={15} />
                  </span>
                </Link>
                <button onClick={() => go("profile")}>
                  <span className="essential-icon lavender">
                    <ImagePlus size={25} />
                  </span>
                  <h2>Preparar mi perfil</h2>
                  <p>Añade fotos, presenta tu negocio y crea tu catálogo.</p>
                  <span className="essential-link">
                    Editar mi perfil <ArrowRight size={15} />
                  </span>
                </button>
                <Link href={publicHref}>
                  <span className="essential-icon peach">
                    <Store size={25} />
                  </span>
                  <h2>Ver lo que ve el cliente</h2>
                  <p>
                    Revisa tu perfil, tus productos y las opciones de reserva.
                  </p>
                  <span className="essential-link">
                    Abrir mi negocio <ArrowUpRight size={15} />
                  </span>
                </Link>
              </section>
              <div className="business-home-columns">
                <section className="business-home-card">
                  <div className="business-section-title">
                    <div>
                      <h2>Conversaciones</h2>
                      <p>Un espacio privado para cada relación.</p>
                    </div>
                    <Link href={chatHref} className="inline-link">
                      Ver mensajes <ArrowUpRight size={15} />
                    </Link>
                  </div>
                  <div className="home-conversations">
                    {conversations.map((conversation) => (
                      <Link
                        key={conversation.id}
                        href={`${chatHref}&conversacion=${conversation.id}`}
                      >
                        <span className="conversation-avatar">
                          {conversation.initials}
                        </span>
                        <span>
                          <strong>
                            {conversation.name}
                            <small>{conversation.subject}</small>
                          </strong>
                          <p>{conversation.detail}</p>
                        </span>
                        <ChevronRight size={17} />
                      </Link>
                    ))}
                  </div>
                  <div className="home-privacy">
                    <ShieldCheck size={15} />
                    <span>
                      Las entregas se comparten en el chat. Las fotos del perfil
                      se muestran aparte.
                    </span>
                  </div>
                </section>
                <section className="business-home-card home-profile-card">
                  <div className="profile-cover-preview">
                    <span>
                      {businessId === "photo" ? (
                        <Camera size={35} />
                      ) : (
                        <Store size={35} />
                      )}
                    </span>
                    <i />
                    <i />
                  </div>
                  <div>
                    <span className="tag">Perfil de demostración</span>
                    <h2>{config.name}</h2>
                    <p>
                      {sector.label} · {config.city || "Sin zona"}
                    </p>
                    <div className="profile-shortcuts">
                      <button
                        className="button secondary small"
                        onClick={() => go("profile")}
                      >
                        Editar perfil
                      </button>
                      <Link href={publicHref} className="inline-link">
                        Vista cliente <ArrowUpRight size={15} />
                      </Link>
                    </div>
                  </div>
                </section>
              </div>
              <section className="business-home-card requests-card">
                <div className="business-section-title">
                  <div>
                    <h2>Solicitudes de ejemplo</h2>
                    <p>
                      Revisa aquí las pruebas que prepares desde tu perfil de
                      negocio.
                    </p>
                  </div>
                  <span className="tag">{ownRequests.length} locales</span>
                </div>
                {ownRequests.length ? (
                  <div className="home-request-list">
                    {ownRequests.slice(0, 4).map((request) => (
                      <article key={request.id}>
                        <CalendarDays size={20} />
                        <div>
                          <h3>{request.itemTitle}</h3>
                          <p>
                            {request.date} · {request.time} · Alex López,
                            cliente ficticio
                          </p>
                        </div>
                        <span className="tag">No enviada</span>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="home-requests-empty">
                    <CalendarDays size={24} />
                    <div>
                      <strong>Todavía no has probado ninguna reserva.</strong>
                      <p>
                        Abre tu perfil como cliente y prepara una solicitud de
                        ejemplo.
                      </p>
                    </div>
                    <Link className="button secondary small" href={publicHref}>
                      Probar recorrido <ArrowRight size={14} />
                    </Link>
                  </div>
                )}
              </section>
            </>
          ) : current === "profile" ? (
            <BusinessProfileEditor
              config={config}
              onConfigChange={updateProfileIdentity}
            />
          ) : current === "modules" ? (
            <section className="workspace-module-settings">
              <div className="simple-module-notice">
                <Blocks size={22} />
                <div>
                  <h2>Un panel con lo que necesitas</h2>
                  <p>
                    Mensajes, clientes y tu perfil están siempre a mano. El
                    resto depende de tu actividad.
                  </p>
                </div>
                <Link href="/onboarding" className="button secondary small">
                  Cambiar actividad
                </Link>
              </div>
              <p className="workspace-storage-status" role="status">
                {status ||
                  "Los cambios se guardan automáticamente sólo en este navegador."}
              </p>
              <ModulePicker
                modules={config.modules}
                onChange={updateModules}
                sectorId={config.sectorId}
              />
              <div className="profile-module-shortcuts">
                <button
                  className="button secondary"
                  onClick={() => go("profile")}
                >
                  <Store size={16} />
                  Fotos, servicios y productos
                </button>
                <Link href={chatHref} className="button secondary">
                  <MessageCircle size={16} />
                  Conversaciones y archivos
                </Link>
              </div>
            </section>
          ) : profileModules.has(current) ? (
            <BusinessProfileEditor
              config={config}
              onConfigChange={updateProfileIdentity}
            />
          ) : chatModules.has(current) ? (
            <div className="empty-state">
              <MessageCircle size={28} />
              <h2>Todo el trabajo, en la conversación.</h2>
              <p>Comparte archivos con el cliente desde sus mensajes.</p>
              <Link href={chatHref} className="button primary">
                Abrir mensajes <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <>
              <label className="module-search">
                <Search size={17} />
                <input
                  aria-label="Buscar en este módulo"
                  placeholder={`Buscar en ${MODULES[current].label.toLowerCase()}…`}
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
            <ShieldCheck size={14} />
            <span>
              Demostración local. Sin mensajes, reservas ni publicaciones
              enviadas a personas reales.
            </span>
          </footer>
        </main>
      </div>
      {help && (
        <Modal title="Cuatro cosas para empezar" onClose={() => setHelp(false)}>
          <ol className="simple-help">
            <li>
              <strong>Mensajes:</strong> habla con el cliente y adjunta archivos
              de prueba.
            </li>
            <li>
              <strong>Mi perfil:</strong> prepara tu presentación, fotos,
              servicios y productos.
            </li>
            <li>
              <strong>Vista cliente:</strong> revisa lo que verá el cliente y
              prueba una solicitud de reserva.
            </li>
            <li>
              <strong>Herramientas:</strong> activa sólo lo que encaje con tu
              negocio.
            </li>
          </ol>
          <div className="notice">
            <ShieldCheck size={18} />
            <p>
              Todo se demuestra en este navegador. No hay cuentas reales ni
              información publicada en Internet.
            </p>
          </div>
          <div className="modal-actions">
            <button className="button primary" onClick={() => setHelp(false)}>
              Entendido
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function NavButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <button
      className={`workspace-nav-item ${active ? "is-active" : ""}`}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
    >
      <Icon size={18} />
      {label}
    </button>
  );
}
