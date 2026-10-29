"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowDownLeft,
  ArrowRight,
  CalendarDays,
  Camera,
  CakeSlice,
  Check,
  ChevronDown,
  Clock3,
  Compass,
  Heart,
  MapPin,
  MessageCircle,
  Scissors,
  Settings2,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wrench,
} from "lucide-react";
import {
  DEMO_PROFILE_EVENT,
  DEMO_REQUEST_EVENT,
  getDemoRequests,
  loadBusinessProfile,
  type BusinessId,
  type BusinessProfile,
  type DemoRequest,
} from "@/features/business-profile/model";
import {
  EXPERIENCE_EVENT,
  loadCustomerProfile,
  saveCustomerProfile,
  type CustomerProfile,
} from "@/lib/experience";
import "@/components/client-directory.css";

const experiences = [
  {
    id: "photo",
    title: "Tu próximo gran recuerdo.",
    service: "Sesión de retrato",
    business: "Lumen Studio",
    date: "12 nov.",
    time: "10:00–11:00",
    day: "JUE",
    number: "12",
    status: "Ejemplo de cita",
    icon: Camera,
    tone: "lilac",
    detail:
      "Una sesión de retrato en estudio, con selección de imágenes y archivos compartidos en una conversación de muestra. No existe una cita real.",
  },
  {
    id: "beauty",
    title: "Un momento para ti.",
    service: "Corte y cuidado",
    business: "Barbería Norte",
    date: "14 nov.",
    time: "17:30–18:15",
    day: "SÁB",
    number: "14",
    status: "Ejemplo de servicio",
    icon: Scissors,
    tone: "peach",
    detail:
      "Vista previa de una cita con un negocio de cuidado personal. No se ha contactado con el negocio ni reservado ninguna franja.",
  },
  {
    id: "bakery",
    title: "Algo que celebrar.",
    service: "Tarta personalizada",
    business: "Dulce Taller",
    date: "18 nov.",
    time: "Recogida a las 11:00",
    day: "MIÉ",
    number: "18",
    status: "Ejemplo de encargo",
    icon: CakeSlice,
    tone: "pink",
    detail:
      "Un encargo de repostería de ejemplo, independiente del dominio de citas. No se ha enviado ningún pedido.",
  },
];
const favoriteBusinesses = [
  ...experiences,
  {
    id: "repairs",
    service: "Reparación y mantenimiento",
    business: "Taller Central",
    icon: Wrench,
    tone: "sage",
  },
];
const conversationIds: Record<string, string> = {
  photo: "lumen-alex",
  beauty: "barberia-alex",
  bakery: "dulce-alex",
  repairs: "taller-alex",
};
const accountTabs = [
  ["activity", "Mi actividad"],
  ["favorites", "Favoritos"],
  ["account", "Perfil"],
] as const;
const FAVORITES_KEY = "nexo-demo-favorites-v1";
const PREFS_KEY = "nexo-demo-client-preferences-v1";
type Preferences = { reminders: boolean; news: boolean };

export default function ClientPage() {
  const [tab, setTab] = useState<"activity" | "favorites" | "account">(
    "activity",
  );
  const [favorites, setFavorites] = useState<string[]>(["photo", "beauty"]);
  const [preferences, setPreferences] = useState<Preferences>({
    reminders: true,
    news: false,
  });
  const [message, setMessage] = useState("");
  const [customer, setCustomer] = useState<CustomerProfile>({
    name: "Alex López",
    city: "Barcelona",
    interests: [],
  });
  useEffect(() => {
    const refresh = () => setCustomer(loadCustomerProfile());
    refresh();
    window.addEventListener(EXPERIENCE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(EXPERIENCE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  const [requests, setRequests] = useState<DemoRequest[]>([]);
  const [businessProfiles, setBusinessProfiles] = useState<
    Partial<Record<BusinessId, BusinessProfile>>
  >({});
  useEffect(() => {
    const refresh = () => {
      setRequests(getDemoRequests());
      setBusinessProfiles(
        Object.fromEntries(
          favoriteBusinesses.map((item) => [
            item.id,
            loadBusinessProfile(item.id as BusinessId),
          ]),
        ),
      );
    };
    refresh();
    window.addEventListener(DEMO_REQUEST_EVENT, refresh);
    window.addEventListener(DEMO_PROFILE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(DEMO_REQUEST_EVENT, refresh);
      window.removeEventListener(DEMO_PROFILE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  useEffect(() => {
    const section = new URLSearchParams(window.location.search).get("seccion");
    if (section === "favoritos") setTab("favorites");
    if (section === "perfil") setTab("account");
  }, []);
  const businessName = (id: string, fallback: string) =>
    businessProfiles[id as BusinessId]?.name ?? fallback;
  useEffect(() => {
    try {
      const stored: unknown = JSON.parse(
        localStorage.getItem(FAVORITES_KEY) || "null",
      );
      if (Array.isArray(stored))
        setFavorites([
          ...new Set(
            stored.filter(
              (id): id is string =>
                typeof id === "string" &&
                favoriteBusinesses.some((e) => e.id === id),
            ),
          ),
        ]);
      const prefs: unknown = JSON.parse(
        localStorage.getItem(PREFS_KEY) || "null",
      );
      if (
        prefs &&
        typeof prefs === "object" &&
        "reminders" in prefs &&
        "news" in prefs
      )
        setPreferences({
          reminders: prefs.reminders === true,
          news: prefs.news === true,
        });
    } catch {
      /* A blocked storage leaves the demo usable with defaults. */
    }
  }, []);
  function toggleFavorite(id: string) {
    const next = favorites.includes(id)
      ? favorites.filter((f) => f !== id)
      : [...favorites, id];
    setFavorites(next);
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      setMessage(
        next.includes(id)
          ? "Negocio de ejemplo guardado en este navegador."
          : "Negocio de ejemplo eliminado de favoritos.",
      );
    } catch {
      setMessage(
        "La selección cambia en esta visita; el navegador no permite guardarla.",
      );
    }
  }
  function togglePreference(key: keyof Preferences) {
    const next = { ...preferences, [key]: !preferences[key] };
    setPreferences(next);
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(next));
      setMessage(
        "Preferencia de demostración guardada. No se enviarán mensajes.",
      );
    } catch {
      setMessage(
        "La preferencia cambia en esta visita; el navegador no permite guardarla.",
      );
    }
  }
  return (
    <div className="container personal-page">
      <div className="personal-breadcrumb">
        <span>
          <UserRound size={14} /> CLIENTE · COMPLETAMENTE GRATIS
        </span>
        <span>Cuenta de demostración</span>
      </div>
      <div className="personal-heading">
        <div>
          <p className="eyebrow">TUS NEGOCIOS. TU ESPACIO.</p>
          <h1>
            Hola, {customer.name.split(/\s+/)[0]}
            <span className="personal-wave" aria-hidden="true">
              ✳
            </span>
          </h1>
          <p className="muted">
            Habla con tus negocios, descubre sus productos y prepara tu próxima
            visita.
          </p>
        </div>
        <div className="personal-heading-actions">
          <Link href="/mensajes?como=cliente" className="button primary">
            <MessageCircle size={16} /> Mensajes
          </Link>
          <Link href="/explorar" className="button secondary">
            <Compass size={16} /> Explorar negocios <ArrowRight size={16} />
          </Link>
        </div>
      </div>
      <div className="personal-overview">
        <section className="personal-next">
          <div className="personal-next-copy">
            <span className="personal-label">
              <span /> TU PRÓXIMA EXPERIENCIA · FICTICIA
            </span>
            <h2>
              Un retrato.
              <br />
              Muchas historias.
            </h2>
            <p>Sesión de retrato con {businessName("photo", "Lumen Studio")}</p>
            <div className="personal-next-time">
              <span>
                <CalendarDays size={16} /> 12 de noviembre
              </span>
              <span>
                <Clock3 size={16} /> 10:00 h
              </span>
            </div>
            <div className="personal-next-actions">
              <Link href="/negocio/photo" className="personal-text-button">
                Ver negocio <ArrowRight size={16} />
              </Link>
              <Link
                href="/mensajes?como=cliente&conversacion=lumen-alex"
                className="personal-text-button"
              >
                <MessageCircle size={16} /> Hablar con el estudio
              </Link>
            </div>
          </div>
          <div className="personal-camera-art" aria-hidden="true">
            <div className="personal-art-orbit" />
            <div className="personal-art-camera">
              <Camera size={92} strokeWidth={0.8} />
            </div>
            <span className="personal-art-spark">✳</span>
            <span className="personal-art-ticket">
              {businessName("photo", "Lumen Studio")
                .slice(0, 13)
                .toLocaleUpperCase("es")}
              <br />
              <small>ESTUDIO CREATIVO</small>
            </span>
          </div>
        </section>
        <div className="personal-overview-side">
          <div className="personal-stat">
            <span className="personal-stat-icon">
              <CalendarDays size={20} />
            </span>
            <strong>{String(3 + requests.length).padStart(2, "0")}</strong>
            <div>
              <h3>Próximos momentos</h3>
              <p>Actividad ficticia para explorar</p>
            </div>
            <ArrowDownLeft size={18} />
          </div>
          <div className="personal-stat">
            <span className="personal-stat-icon warm">
              <Heart size={20} />
            </span>
            <strong>{String(favorites.length).padStart(2, "0")}</strong>
            <div>
              <h3>Negocios favoritos</h3>
              <p>Tu selección en este navegador</p>
            </div>
            <button
              aria-label="Ver mis favoritos"
              onClick={() => setTab("favorites")}
            >
              <ArrowRight size={18} />
            </button>
          </div>
          <div className="personal-privacy-note">
            <ShieldCheck size={20} />
            <p>
              <strong>Tu actividad es tuya.</strong>
              <br />
              Una empresa sólo podrá ver su relación contigo, nunca tu actividad
              en otras empresas.
            </p>
          </div>
        </div>
      </div>
      <div className="personal-section-top" id="personal-activity">
        <nav className="personal-navigation" aria-label="Navegación de Cliente">
          <Link href="/explorar" className="personal-explore-link">
            <Compass size={15} />
            Explorar
          </Link>
          <div
            className="personal-tabs"
            role="tablist"
            aria-label="Secciones de mi cuenta"
          >
            {accountTabs.map(([key, label], index) => (
              <button
                key={key}
                id={`personal-tab-${key}`}
                role="tab"
                tabIndex={tab === key ? 0 : -1}
                onKeyDown={(event) => {
                  let next = index;
                  if (event.key === "ArrowRight")
                    next = (index + 1) % accountTabs.length;
                  else if (event.key === "ArrowLeft")
                    next =
                      (index + accountTabs.length - 1) % accountTabs.length;
                  else if (event.key === "Home") next = 0;
                  else if (event.key === "End") next = accountTabs.length - 1;
                  else return;
                  event.preventDefault();
                  setTab(accountTabs[next][0]);
                  document
                    .getElementById(`personal-tab-${accountTabs[next][0]}`)
                    ?.focus();
                }}
                aria-selected={tab === key}
                aria-controls="personal-tabpanel"
                className={tab === key ? "active" : ""}
                onClick={() => setTab(key)}
              >
                {label}
                {key === "activity" && <span>{3 + requests.length}</span>}
              </button>
            ))}
          </div>
        </nav>
        <span className="personal-sample-label">
          <Sparkles size={13} /> Datos de ejemplo
        </span>
      </div>
      <div
        id="personal-tabpanel"
        role="tabpanel"
        aria-labelledby={`personal-tab-${tab}`}
      >
        {tab === "activity" && (
          <div className="personal-activity-list">
            {requests.length > 0 && (
              <section
                className="personal-requests"
                aria-labelledby="personal-requests-title"
              >
                <div className="personal-requests-heading">
                  <h2 id="personal-requests-title">
                    Tus solicitudes de prueba
                  </h2>
                  <span>Sólo en este navegador</span>
                </div>
                <p className="personal-requests-note">
                  Estas solicitudes no se han enviado al negocio ni bloquean una
                  fecha.
                </p>
                {requests.map((request) => (
                  <article className="personal-demo-request" key={request.id}>
                    <span className="personal-request-icon">
                      <CalendarDays size={20} />
                    </span>
                    <div>
                      <span className="personal-request-status">
                        NO ENVIADA · DEMO
                      </span>
                      <h3>{request.itemTitle}</h3>
                      <p>
                        {businessName(request.businessId, request.businessName)}{" "}
                        · {formatRequestDate(request.date)} · {request.time}
                      </p>
                      <div className="personal-business-actions">
                        <Link
                          href={`/negocio/${request.businessId}`}
                          className="personal-business-link"
                        >
                          Ver negocio <ArrowRight size={13} />
                        </Link>
                        <Link
                          href={`/mensajes?como=cliente&conversacion=${conversationIds[request.businessId]}`}
                          className="personal-business-link"
                        >
                          <MessageCircle size={13} /> Abrir conversación
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </section>
            )}
            {experiences.map((e) => {
              const Icon = e.icon;
              return (
                <article className="personal-experience" key={e.id}>
                  <div className={`personal-experience-icon ${e.tone}`}>
                    <Icon size={26} strokeWidth={1.5} />
                  </div>
                  <div className="personal-experience-body">
                    <div className="personal-experience-title">
                      <h3>{e.service}</h3>
                      <span className="personal-status">{e.status}</span>
                    </div>
                    <p>
                      {businessName(e.id, e.business)}
                      <span>·</span>
                      <Clock3 size={12} />
                      {e.time}
                    </p>
                    <details>
                      <summary>
                        Ver detalles de ejemplo <ChevronDown size={14} />
                      </summary>
                      <div className="personal-details">
                        <p>{e.detail}</p>
                        <span>
                          <MapPin size={13} /> Barcelona · Ubicación
                          ilustrativa, sin dirección publicada
                        </span>
                        <strong>Sin reserva, pago ni comunicación real.</strong>
                      </div>
                    </details>
                    <div className="personal-business-actions">
                      <Link
                        href={`/negocio/${e.id}`}
                        className="personal-business-link"
                        aria-label={`Ver negocio: ${businessName(e.id, e.business)}`}
                      >
                        Ver negocio <ArrowRight size={13} />
                      </Link>
                      <Link
                        href={`/mensajes?como=cliente&conversacion=${conversationIds[e.id]}`}
                        className="personal-business-link"
                        aria-label={`Mensaje a ${businessName(e.id, e.business)}`}
                      >
                        <MessageCircle size={13} /> Mensaje
                      </Link>
                    </div>
                  </div>
                  <div className="personal-experience-date">
                    <span>{e.day}</span>
                    <strong>{e.number}</strong>
                    <span>NOV 2026</span>
                  </div>
                  <button
                    className={`personal-heart ${favorites.includes(e.id) ? "saved" : ""}`}
                    aria-pressed={favorites.includes(e.id)}
                    aria-label={`${favorites.includes(e.id) ? "Quitar de favoritos" : "Guardar en favoritos"}: ${businessName(e.id, e.business)}`}
                    onClick={() => toggleFavorite(e.id)}
                  >
                    <Heart size={18} />
                  </button>
                </article>
              );
            })}
          </div>
        )}
        {tab === "favorites" && (
          <div className="personal-favorites">
            {favoriteBusinesses
              .filter((e) => favorites.includes(e.id))
              .map((e) => {
                const Icon = e.icon;
                return (
                  <article className="personal-favorite" key={e.id}>
                    <div className={`personal-experience-icon ${e.tone}`}>
                      <Icon size={26} />
                    </div>
                    <span className="personal-status">Negocio ficticio</span>
                    <h3>{businessName(e.id, e.business)}</h3>
                    <p>
                      {e.service} ·{" "}
                      {businessProfiles[e.id as BusinessId]?.city ??
                        "Barcelona"}
                    </p>
                    <div className="personal-favorite-actions">
                      <Link
                        href={`/negocio/${e.id}`}
                        className="button primary small"
                        aria-label={`Ver negocio: ${businessName(e.id, e.business)}`}
                      >
                        Ver negocio <ArrowRight size={14} />
                      </Link>
                      <Link
                        href={`/mensajes?como=cliente&conversacion=${conversationIds[e.id]}`}
                        className="button secondary small"
                        aria-label={`Mensaje a ${businessName(e.id, e.business)}`}
                      >
                        <MessageCircle size={14} /> Mensaje
                      </Link>
                      <button
                        className="personal-unfavorite"
                        onClick={() => toggleFavorite(e.id)}
                        aria-label={`Quitar de favoritos: ${businessName(e.id, e.business)}`}
                      >
                        <Heart size={13} fill="currentColor" /> Quitar de
                        favoritos
                      </button>
                    </div>
                  </article>
                );
              })}
            {favorites.length === 0 && (
              <div className="personal-empty">
                <Heart size={28} />
                <h3>Haz sitio para tus favoritos.</h3>
                <p>
                  Guarda un negocio de ejemplo desde Mi actividad o Explorar.
                </p>
                <Link href="/explorar" className="button secondary">
                  Explorar negocios <ArrowRight size={15} />
                </Link>
              </div>
            )}
          </div>
        )}
        {tab === "account" && (
          <div className="personal-profile">
            <section>
              <div className="personal-profile-head">
                <span className="personal-avatar">
                  {customer.name.slice(0, 1).toLocaleUpperCase("es")}
                </span>
                <div>
                  <h2>{customer.name.split(/\s+/)[0]}, perfil de ejemplo</h2>
                  <p>No hay ninguna cuenta registrada</p>
                </div>
                <span className="personal-status">DEMO</span>
              </div>
              <form
                className="personal-identity-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!customer.name.trim()) {
                    setMessage(
                      "Añade un nombre de ejemplo para guardar el perfil.",
                    );
                    return;
                  }
                  const next = {
                    ...customer,
                    name: customer.name.trim(),
                    city: customer.city.trim(),
                  };
                  const saved = saveCustomerProfile(next);
                  setCustomer(next);
                  setMessage(
                    saved
                      ? "Perfil de Cliente guardado en este navegador. No se crea una cuenta real."
                      : "Los datos cambian durante esta visita; este navegador no permite guardarlos.",
                  );
                }}
              >
                <label className="input-label" htmlFor="customer-display-name">
                  Nombre de ejemplo
                </label>
                <input
                  className="field"
                  id="customer-display-name"
                  maxLength={80}
                  required
                  value={customer.name}
                  onChange={(event) =>
                    setCustomer((value) => ({
                      ...value,
                      name: event.target.value,
                    }))
                  }
                />
                <label className="input-label" htmlFor="customer-city">
                  Ciudad preferida
                </label>
                <input
                  className="field"
                  id="customer-city"
                  maxLength={80}
                  value={customer.city}
                  onChange={(event) =>
                    setCustomer((value) => ({
                      ...value,
                      city: event.target.value,
                    }))
                  }
                />
                <button className="button secondary small" type="submit">
                  Guardar datos de ejemplo
                </button>
              </form>
              <div className="personal-profile-info">
                <UserRound size={19} />
                <div>
                  <h3>Una identidad, distintas relaciones</h3>
                  <p>
                    La futura cuenta conectará sólo relaciones comerciales
                    verificadas. No se comparten tus datos entre negocios
                    automáticamente.
                  </p>
                </div>
              </div>
              <div className="personal-profile-info">
                <ShieldCheck size={19} />
                <div>
                  <h3>Sin datos personales reales</h3>
                  <p>
                    El registro, la verificación de identidad y los controles de
                    privacidad se revisarán en próximos hitos.
                  </p>
                </div>
              </div>
            </section>
            <section>
              <h2>
                <Settings2 size={18} /> Preferencias de muestra
              </h2>
              <p className="personal-profile-note">
                Estas opciones sólo cambian la interfaz local. No se envía
                ninguna notificación.
              </p>
              <Preference
                label="Recordatorios de actividad"
                description="Vista previa de tus preferencias"
                checked={preferences.reminders}
                onChange={() => togglePreference("reminders")}
              />
              <Preference
                label="Novedades de mis favoritos"
                description="Sin suscripción ni mensajes reales"
                checked={preferences.news}
                onChange={() => togglePreference("news")}
              />
            </section>
          </div>
        )}
      </div>
      <p className="personal-feedback" role="status">
        {message}
      </p>
      <div className="personal-bottom">
        <div>
          <Sparkles size={20} />
          <div>
            <h3>¿Tu próximo favorito está por descubrir?</h3>
            <p>
              Explora una pequeña muestra de cómo se verá el directorio de
              AutonoService.
            </p>
          </div>
        </div>
        <Link className="button secondary" href="/explorar">
          Descubrir <ArrowRight size={16} />
        </Link>
      </div>
      <p className="personal-disclaimer">
        <ShieldCheck size={14} /> Prototipo Hito 0 · Todas las personas,
        empresas y actividades son ficticias. Sin cuentas ni operaciones reales.
      </p>
    </div>
  );
}

function formatRequestDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("es", { day: "numeric", month: "short" }).format(
        date,
      );
}

function Preference({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="personal-preference">
      <div>
        <strong>{label}</strong>
        <small>{description}</small>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={`personal-switch ${checked ? "on" : ""}`}
        onClick={onChange}
      >
        <span>{checked && <Check size={10} />}</span>
      </button>
    </div>
  );
}
