"use client";
import { createDemoId } from "@/lib/demo-id";


import Link from "next/link";
import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Camera,
  Check,
  CheckCircle2,
  Clock3,
  ImagePlus,
  MapPin,
  MessageCircle,
  Package,
  Pencil,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import { Modal } from "@/components/modal";
import type { DemoConfig } from "@/lib/demo";
import {
  DEMO_PROFILE_EVENT,
  DEMO_TIME_SLOTS,
  createDemoRequest,
  getBusinessIdForSector,
  isBusinessId,
  loadBusinessProfile,
  normalizeBusinessProfile,
  profileFromConfig,
  saveBusinessProfile,
  type BusinessId,
  type BusinessProfile,
  type CatalogItem,
  type ProfilePhoto,
} from "./model";
import { sectorById } from "@/lib/catalog";
import "./profile.css";

const conversationIds: Record<BusinessId, string> = {
  photo: "lumen-alex",
  beauty: "barberia-alex",
  bakery: "dulce-alex",
  repairs: "taller-alex",
};
const profileThemes: Record<
  BusinessId,
  { label: string; description: string; art: string }
> = {
  photo: {
    label: "Historias que merecen una foto.",
    description: "Personas, marcas y pequeños momentos.",
    art: "studio",
  },
  beauty: {
    label: "Tu estilo. Tu momento.",
    description: "Cuidado personal con tiempo para ti.",
    art: "beauty",
  },
  bakery: {
    label: "Hecho para compartir.",
    description: "Pequeñas celebraciones, grandes recuerdos.",
    art: "bakery",
  },
  repairs: {
    label: "Las cosas buenas merecen durar.",
    description: "Cuidado y reparación para tu día a día.",
    art: "workshop",
  },
};
const emptyItem: Omit<CatalogItem, "id"> = {
  title: "",
  description: "",
  kind: "service",
  price: 0,
  duration: 60,
  bookable: true,
};
const money = (amount: number) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(amount);
const todayInput = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

/** Public-looking UI only. The four profiles are fictitious and never published. */
export function BusinessPublicProfile({ id }: { id: string }) {
  const valid = isBusinessId(id);
  const businessId: BusinessId = valid ? id : "photo";
  const [profile, setProfile] = useState<BusinessProfile>(() =>
    normalizeBusinessProfile(null, businessId),
  );
  const [tab, setTab] = useState<"posts" | "catalog" | "info">("posts");
  const [booking, setBooking] = useState<CatalogItem | null>(null);
  const [success, setSuccess] = useState("");
  useEffect(() => {
    const refresh = () => setProfile(loadBusinessProfile(businessId));
    refresh();
    window.addEventListener(DEMO_PROFILE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(DEMO_PROFILE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [businessId]);
  if (!valid)
    return (
      <div className="container bp-missing">
        <h1>No encontramos ese perfil de ejemplo.</h1>
        <p>Elige uno de los cuatro negocios ficticios del directorio.</p>
        <Link className="button primary" href="/explorar">
          Volver a explorar <ArrowRight size={16} />
        </Link>
      </div>
    );
  const theme = profileThemes[businessId];
  const tabs = [
    { id: "posts" as const, label: "Publicaciones" },
    { id: "catalog" as const, label: "Servicios y productos" },
    { id: "info" as const, label: "Información" },
  ];
  const switchTab = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    const next =
      event.key === "ArrowRight"
        ? (index + 1) % tabs.length
        : event.key === "ArrowLeft"
          ? (index + tabs.length - 1) % tabs.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? tabs.length - 1
              : -1;
    if (next < 0) return;
    event.preventDefault();
    setTab(tabs[next].id);
    document.getElementById(`bp-tab-${tabs[next].id}`)?.focus();
  };
  return (
    <div className="container bp-public">
      <div className="bp-page-top">
        <Link href="/explorar">
          <ArrowLeft size={15} />
          Volver a explorar
        </Link>
        <span>
          <ShieldCheck size={13} />
          Perfil ficticio · Vista cliente
        </span>
      </div>
      <div className={`bp-cover bp-cover-${theme.art}`} aria-hidden="true">
        <span className="bp-cover-orbit" />
        <span className="bp-cover-orbit" />
        <span className="bp-cover-frame">
          <Camera size={45} strokeWidth={1} />
        </span>
        <div>
          <small>UN NEGOCIO. MUCHAS HISTORIAS.</small>
          <strong>{theme.label}</strong>
          <span>{theme.description}</span>
        </div>
      </div>
      <section className="bp-identity" aria-label="Presentación del negocio">
        <span className="bp-avatar">{profile.name.slice(0, 1)}</span>
        <div className="bp-identity-copy">
          <span className="bp-category">{profile.category}</span>
          <h1>{profile.name}</h1>
          <p>{profile.bio}</p>
          <span className="bp-location">
            <MapPin size={13} />
            {profile.city || "Ciudad por definir"}
            <i />
            Negocio de ejemplo
          </span>
        </div>
        <div className="bp-profile-actions">
          <Link
            href={`/mensajes?como=cliente&conversacion=${conversationIds[businessId]}`}
            className="button primary"
          >
            <MessageCircle size={16} />
            Escribir mensaje
          </Link>
          <button
            className="button secondary"
            onClick={() => {
              setTab("catalog");
              setTimeout(
                () =>
                  document
                    .getElementById("bp-tabs")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" }),
                0,
              );
            }}
          >
            Ver servicios y productos <ArrowDownIcon />
          </button>
        </div>
      </section>
      <div
        className="bp-tabs"
        role="tablist"
        aria-label="Contenido del negocio"
        id="bp-tabs"
      >
        {tabs.map((item, index) => (
          <button
            key={item.id}
            type="button"
            id={`bp-tab-${item.id}`}
            role="tab"
            aria-selected={tab === item.id}
            aria-controls={`bp-panel-${item.id}`}
            tabIndex={tab === item.id ? 0 : -1}
            onClick={() => setTab(item.id)}
            onKeyDown={(event) => switchTab(event, index)}
          >
            {item.label}
            {item.id === "catalog" && (
              <span aria-hidden="true">{profile.catalog.length}</span>
            )}
          </button>
        ))}
      </div>
      <section
        role="tabpanel"
        aria-labelledby={`bp-tab-${tab}`}
        id={`bp-panel-${tab}`}
        className="bp-tab-content"
      >
        {tab === "posts" && (
          <>
            <div className="bp-section-heading">
              <div>
                <h2>Una pequeña ventana a nuestro trabajo.</h2>
                <p>Fotos del espacio, productos y momentos del negocio.</p>
              </div>
              <span className="tag">Contenido de demostración</span>
            </div>
            <PhotoGrid photos={profile.photos} businessId={businessId} />
            <div className="bp-public-prompt">
              <div>
                <MessageCircle size={22} />
                <span>
                  <strong>¿Tienes algo en mente?</strong>
                  <small>Empieza por una conversación con el negocio.</small>
                </span>
              </div>
              <Link
                className="inline-link"
                href={`/mensajes?como=cliente&conversacion=${conversationIds[businessId]}`}
              >
                Abrir conversación <ArrowRight size={15} />
              </Link>
            </div>
          </>
        )}
        {tab === "catalog" && (
          <>
            <div className="bp-section-heading">
              <div>
                <h2>Encuentra lo que necesitas.</h2>
                <p>El mismo catálogo que el negocio prepara en su perfil.</p>
              </div>
              <span className="tag">Precios orientativos</span>
            </div>
            {profile.catalog.length ? (
              <div className="bp-catalog-grid">
                {profile.catalog.map((item) => (
                  <article className="bp-catalog-card" key={item.id}>
                    <div
                      className={`bp-catalog-art bp-catalog-art-${item.kind}`}
                      aria-hidden="true"
                    >
                      {item.kind === "product" ? (
                        <ShoppingBag size={35} strokeWidth={1} />
                      ) : (
                        <Camera size={35} strokeWidth={1} />
                      )}
                      <span>
                        {item.kind === "product"
                          ? "PRODUCTO DE EJEMPLO"
                          : "SERVICIO DE EJEMPLO"}
                      </span>
                      <i />
                      <i />
                    </div>
                    <div className="bp-catalog-card-body">
                      <span className="bp-category">
                        {item.kind === "product" ? "Producto" : "Servicio"}
                      </span>
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                      <div className="bp-catalog-meta">
                        <strong>
                          {money(item.price)}
                          <small>Orientativo</small>
                        </strong>
                        {item.kind === "service" && (
                          <span>
                            <Clock3 size={13} />
                            {item.duration} min
                          </span>
                        )}
                      </div>
                      {item.kind === "service" && item.bookable ? (
                        <button
                          type="button"
                          className="button primary"
                          aria-label={`Reservar ${item.title}`}
                          onClick={() => {
                            setSuccess("");
                            setBooking(item);
                          }}
                        >
                          Reservar <ArrowRight size={15} />
                        </button>
                      ) : (
                        <Link
                          className="button secondary"
                          aria-label={`Consultar ${item.title}`}
                          href={`/mensajes?como=cliente&conversacion=${conversationIds[businessId]}`}
                        >
                          Consultar{" "}
                          {item.kind === "product" ? "producto" : "servicio"}{" "}
                          <MessageCircle size={15} />
                        </Link>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="bp-empty">
                <Package size={30} />
                <h3>El catálogo todavía está por preparar.</h3>
                <p>
                  Puedes iniciar una conversación para consultar este negocio de
                  ejemplo.
                </p>
              </div>
            )}
            {success && (
              <div className="bp-success" role="status">
                <CheckCircle2 size={20} />
                <p>{success}</p>
                <Link className="inline-link" href="/demo/cliente">
                  Ver mi actividad <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </>
        )}
        {tab === "info" && (
          <div className="bp-info-grid">
            <article>
              <span className="bp-info-icon">
                <MapPin size={23} />
              </span>
              <h2>Conoce el negocio</h2>
              <p>{profile.bio}</p>
              <dl>
                <div>
                  <dt>Actividad</dt>
                  <dd>{profile.category}</dd>
                </div>
                <div>
                  <dt>Ciudad de ejemplo</dt>
                  <dd>{profile.city || "Sin ciudad"}</dd>
                </div>
                <div>
                  <dt>Perfil</dt>
                  <dd>Demostración, no publicado</dd>
                </div>
              </dl>
            </article>
            <aside>
              <ShieldCheck size={23} />
              <h3>Un espacio para cada relación.</h3>
              <p>
                El perfil muestra sólo la información que el negocio prepara
                para sus clientes. Las conversaciones y los archivos se
                mantienen en un espacio separado.
              </p>
              <p>
                Esta demo no utiliza tu ubicación ni muestra direcciones reales.
                Las reservas son solicitudes locales de ejemplo, sin envío ni
                disponibilidad real.
              </p>
              <Link
                className="inline-link"
                href={`/mensajes?como=cliente&conversacion=${conversationIds[businessId]}`}
              >
                Abrir conversación de ejemplo <ArrowRight size={14} />
              </Link>
            </aside>
          </div>
        )}
      </section>
      <div className="notice bp-disclaimer">
        <ShieldCheck size={17} />
        <p>
          Todos los negocios, servicios y productos son ficticios. No hay
          publicación pública, compras, reservas reales ni mensajes enviados.
        </p>
      </div>
      {booking && (
        <DemoBookingModal
          item={booking}
          profile={profile}
          onClose={() => setBooking(null)}
          onSaved={() => {
            setBooking(null);
            setSuccess(
              "Solicitud de ejemplo guardada en este navegador. No se ha enviado al negocio.",
            );
          }}
        />
      )}
    </div>
  );
}

function ArrowDownIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function PhotoGrid({
  photos,
  businessId,
  editable = false,
  onRemove,
}: {
  photos: ProfilePhoto[];
  businessId: BusinessId;
  editable?: boolean;
  onRemove?: (id: string) => void;
}) {
  return (
    <div className={`bp-photo-grid ${editable ? "is-editable" : ""}`}>
      {photos.length
        ? photos.map((photo) => (
            <figure key={photo.id} className="bp-photo">
              <img src={photo.src} alt={photo.alt} />
              <figcaption>{photo.alt}</figcaption>
              {editable && (
                <button
                  type="button"
                  aria-label={`Eliminar foto ${photo.alt}`}
                  onClick={() => onRemove?.(photo.id)}
                >
                  <Trash2 size={15} />
                </button>
              )}
            </figure>
          ))
        : ["Nuestro trabajo", "El espacio", "Los detalles"].map(
            (label, index) => (
              <figure
                className={`bp-photo-placeholder bp-art-${businessId} bp-art-${index}`}
                key={label}
              >
                <span />
                <span />
                <span />
                <Camera size={32} strokeWidth={1} />
                <figcaption>
                  <strong>{label}</strong>
                  <small>Composición de muestra · Sin fotos reales</small>
                </figcaption>
              </figure>
            ),
          )}
    </div>
  );
}

function DemoBookingModal({
  item,
  profile,
  onClose,
  onSaved,
}: {
  item: CatalogItem;
  profile: BusinessProfile;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [step, setStep] = useState(0);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [understood, setUnderstood] = useState(false);
  const [error, setError] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!date || date < todayInput() || !time) {
      setError("Elige una fecha futura y una hora orientativa para continuar.");
      return;
    }
    if (step === 0) {
      setStep(1);
      return;
    }
    if (!understood) {
      setError(
        "Confirma que entiendes que esta solicitud es sólo una demostración.",
      );
      return;
    }
    const result = createDemoRequest({
      businessId: profile.id,
      itemId: item.id,
      date,
      time,
      notes,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onSaved();
  };
  return (
    <Modal title="Preparar reserva de ejemplo" onClose={onClose}>
      <form onSubmit={submit}>
        <p className="bp-reservation-summary">
          <strong>{item.title}</strong>
          <span>
            {profile.name} · {item.duration} min · {money(item.price)}{" "}
            orientativos
          </span>
        </p>
        <div className="bp-booking-steps">
          <span className={step === 0 ? "is-current" : ""}>
            1. Tu preferencia
          </span>
          <ArrowRight size={12} />
          <span className={step === 1 ? "is-current" : ""}>2. Revisar</span>
        </div>
        {step === 0 ? (
          <>
            <label htmlFor="bp-booking-date">Fecha de ejemplo</label>
            <input
              className="field"
              id="bp-booking-date"
              type="date"
              min={todayInput()}
              value={date}
              required
              onChange={(event) => setDate(event.target.value)}
            />
            <label htmlFor="bp-booking-time">Hora orientativa</label>
            <select
              className="field"
              id="bp-booking-time"
              value={time}
              required
              onChange={(event) => setTime(event.target.value)}
            >
              <option value="">Elige una hora de muestra</option>
              {DEMO_TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
            <label htmlFor="bp-booking-notes">
              Comentario de ejemplo (opcional)
            </label>
            <textarea
              className="field"
              id="bp-booking-notes"
              maxLength={250}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Utiliza únicamente texto de prueba."
            />
            <p className="bp-booking-note">
              Las horas son ejemplos; no representan disponibilidad del negocio.
            </p>
          </>
        ) : (
          <>
            <div className="bp-review-request">
              <span>
                Fecha solicitada de ejemplo
                <strong>{date.split("-").reverse().join("/")}</strong>
              </span>
              <span>
                Hora orientativa<strong>{time} h</strong>
              </span>
            </div>
            {notes && <p className="bp-request-notes">{notes}</p>}
            <label className="bp-consent">
              <input
                type="checkbox"
                checked={understood}
                onChange={(event) => setUnderstood(event.target.checked)}
              />
              <span>Entiendo que esta solicitud no se envía al negocio</span>
            </label>
            <div className="notice">
              <ShieldCheck size={17} />
              <p>
                No se bloquea ninguna plaza ni se confirma una reserva. Sólo se
                guarda una solicitud ficticia en este navegador.
              </p>
            </div>
          </>
        )}
        {error && (
          <p className="bp-form-error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          {step === 1 && (
            <button
              type="button"
              className="button secondary"
              onClick={() => setStep(0)}
            >
              Cambiar fecha
            </button>
          )}
          <button type="submit" className="button primary">
            {step === 0 ? "Revisar solicitud" : "Guardar solicitud de ejemplo"}
            <ArrowRight size={14} />
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function BusinessProfileEditor({
  config,
  onConfigChange,
}: {
  config: DemoConfig;
  onConfigChange?: (patch: Partial<DemoConfig>) => boolean;
}) {
  const [profile, setProfile] = useState<BusinessProfile>(() =>
    profileFromConfig(config),
  );
  const [item, setItem] = useState<CatalogItem | null>(null);
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (
      profile.name.trim() === config.name.trim() &&
      profile.city.trim() === config.city.trim() &&
      profile.id === getBusinessIdForSector(config.sectorId) &&
      profile.category === sectorById(config.sectorId).label
    )
      return;
    setProfile(profileFromConfig(config));
    setDirty(false);
    setStatus("");
    setError("");
  }, [config.name, config.city, config.sectorId]);
  const update = (patch: Partial<BusinessProfile>) => {
    setProfile((value) => ({ ...value, ...patch }));
    setDirty(true);
    setStatus("");
    setError("");
  };
  const save = () => {
    setError("");
    if (!profile.name.trim() || !profile.bio.trim()) {
      setError(
        "Añade un nombre y una descripción del negocio para guardar tu perfil de ejemplo.",
      );
      return;
    }
    if (!saveBusinessProfile(profile)) {
      setError(
        "No se ha podido guardar el perfil. El navegador puede estar lleno o tener el almacenamiento bloqueado. Prueba con menos fotos.",
      );
      return;
    }
    const configSaved =
      onConfigChange?.({
        name: profile.name.trim(),
        city: profile.city.trim(),
      }) ?? true;
    if (!configSaved) {
      setError(
        "El perfil se guardó, pero no se pudo actualizar el nombre del panel. El almacenamiento puede estar lleno.",
      );
      return;
    }
    setDirty(false);
    setStatus(
      "Perfil de ejemplo guardado. Los clientes verán este mismo catálogo en este navegador.",
    );
  };
  const addPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    setError("");
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    if (files.length + profile.photos.length > 6) {
      setError("Puedes añadir hasta 6 fotos de ejemplo.");
      return;
    }
    const photos: ProfilePhoto[] = [];
    for (const file of files) {
      if (
        !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
        !/\.(jpe?g|png|webp)$/i.test(file.name)
      ) {
        setError(
          "Usa fotos JPG, PNG o WebP. No se admiten otros tipos de archivo.",
        );
        return;
      }
      if (file.size > 350000) {
        setError(
          "Cada foto de ejemplo puede ocupar como máximo 350 KB. Elige una imagen más pequeña.",
        );
        return;
      }
      try {
        const src = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () =>
            typeof reader.result === "string"
              ? resolve(reader.result)
              : reject(new Error());
          reader.onerror = () => reject(new Error());
          reader.readAsDataURL(file);
        });
        photos.push({
          id: `foto-${createDemoId()}`,
          src,
          alt: file.name.replace(/\.[^.]+$/, "").slice(0, 80),
        });
      } catch {
        setError(
          "No hemos podido leer esa foto. Prueba con otra imagen de ejemplo.",
        );
        return;
      }
    }
    const combined = [...profile.photos, ...photos];
    if (combined.reduce((sum, photo) => sum + photo.src.length, 0) > 2500000) {
      setError(
        "El conjunto de fotos es demasiado grande para esta demo local. Quita alguna imagen antes de añadir más.",
      );
      return;
    }
    update({ photos: combined });
  };
  const saveItem = (updated: CatalogItem) => {
    update({
      catalog: item
        ? profile.catalog.map((entry) =>
            entry.id === item.id ? updated : entry,
          )
        : [...profile.catalog, updated],
    });
    setEditing(false);
    setItem(null);
  };
  return (
    <div className="bp-editor">
      <div className="bp-editor-intro">
        <div>
          <span className="eyebrow">TU NEGOCIO, DE CARA AL CLIENTE</span>
          <h2>Así ven tu negocio.</h2>
          <p>
            Tu presentación, tus fotos y tu catálogo. Todo en un solo perfil.
          </p>
        </div>
        <Link
          className="button secondary small"
          href={`/negocio/${getBusinessIdForSector(config.sectorId)}`}
        >
          Ver como cliente <ArrowUpRight size={14} />
        </Link>
      </div>
      <div className="bp-editor-layout">
        <section className="bp-editor-main">
          <div className="bp-editor-section">
            <div className="bp-editor-section-heading">
              <span className="bp-editor-number">01</span>
              <div>
                <h3>Cuenta quién eres</h3>
                <p>Una presentación breve y clara para tus clientes.</p>
              </div>
            </div>
            <div className="bp-form-columns">
              <div>
                <label className="input-label" htmlFor="bp-business-name">
                  Nombre del negocio
                </label>
                <input
                  className="field"
                  id="bp-business-name"
                  value={profile.name}
                  maxLength={80}
                  onChange={(event) => update({ name: event.target.value })}
                />
              </div>
              <div>
                <label className="input-label" htmlFor="bp-business-city">
                  Ciudad de ejemplo
                </label>
                <input
                  className="field"
                  id="bp-business-city"
                  value={profile.city}
                  maxLength={80}
                  onChange={(event) => update({ city: event.target.value })}
                />
              </div>
            </div>
            <label className="input-label" htmlFor="bp-business-bio">
              Descripción del negocio
            </label>
            <textarea
              className="field bp-bio"
              id="bp-business-bio"
              maxLength={500}
              value={profile.bio}
              onChange={(event) => update({ bio: event.target.value })}
            />
            <span className="bp-field-hint">
              {profile.bio.length}/500 · Sólo información de ejemplo.
            </span>
          </div>
          <div className="bp-editor-section">
            <div className="bp-editor-section-heading">
              <span className="bp-editor-number">02</span>
              <div>
                <h3>Muéstralo con fotos</h3>
                <p>Tu espacio, tus productos o una muestra de tu trabajo.</p>
              </div>
            </div>
            <PhotoGrid
              photos={profile.photos}
              businessId={profile.id}
              editable
              onRemove={(id) =>
                update({
                  photos: profile.photos.filter((photo) => photo.id !== id),
                })
              }
            />
            <label className="bp-upload-button">
              <ImagePlus size={15} />
              <span>Añadir fotos de ejemplo</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={addPhoto}
              />
            </label>
            <p className="bp-field-hint">
              Hasta 6 fotos JPG, PNG o WebP de 350 KB cada una. Se guardan sólo
              en este navegador. No añadas imágenes de clientes reales.
            </p>
          </div>
          <div className="bp-editor-section">
            <div className="bp-editor-section-heading">
              <span className="bp-editor-number">03</span>
              <div>
                <h3>Lo que ofreces</h3>
                <p>El catálogo que consultan tus clientes desde tu perfil.</p>
              </div>
            </div>
            <div className="bp-editor-catalog">
              {profile.catalog.map((entry) => (
                <article key={entry.id}>
                  <span className="bp-item-icon">
                    {entry.kind === "product" ? (
                      <ShoppingBag size={19} />
                    ) : (
                      <Camera size={19} />
                    )}
                  </span>
                  <div>
                    <strong>{entry.title}</strong>
                    <small>
                      {entry.kind === "product" ? "Producto" : "Servicio"} ·{" "}
                      {money(entry.price)}
                      {entry.kind === "service"
                        ? ` · ${entry.duration} min`
                        : ""}
                    </small>
                  </div>
                  <button
                    className="icon-button"
                    type="button"
                    aria-label={`Editar ${entry.title}`}
                    onClick={() => {
                      setItem(entry);
                      setEditing(true);
                    }}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    className="icon-button"
                    type="button"
                    aria-label={`Eliminar ${entry.title}`}
                    onClick={() =>
                      update({
                        catalog: profile.catalog.filter(
                          (row) => row.id !== entry.id,
                        ),
                      })
                    }
                  >
                    <Trash2 size={14} />
                  </button>
                </article>
              ))}
            </div>
            {profile.catalog.length === 0 && (
              <p className="bp-field-hint">
                Aún no has añadido servicios o productos.
              </p>
            )}
            <button
              type="button"
              className="button secondary"
              disabled={profile.catalog.length >= 12}
              onClick={() => {
                setItem(null);
                setEditing(true);
              }}
            >
              <Plus size={15} />
              Añadir servicio o producto
            </button>
            <p className="bp-field-hint">
              Máximo 12 elementos en esta demostración. Los productos se
              consultan por chat; los servicios pueden admitir solicitudes de
              reserva ficticias.
            </p>
          </div>
          <div className="bp-editor-save">
            <span>
              {dirty
                ? "Tienes cambios sin guardar"
                : "Tu perfil de ejemplo está al día"}
            </span>
            <button className="button primary" type="button" onClick={save}>
              <Check size={15} />
              Guardar perfil de ejemplo
            </button>
          </div>
          {status && (
            <p className="bp-success" role="status">
              <CheckCircle2 size={17} />
              {status}
            </p>
          )}
          {error && (
            <p className="bp-form-error" role="alert">
              {error}
            </p>
          )}
        </section>
        <aside className="bp-editor-preview">
          <span className="bp-category">VISTA PREVIA</span>
          <div
            className={`bp-editor-preview-cover bp-cover-${profileThemes[profile.id].art}`}
          >
            <Camera size={28} strokeWidth={1} />
          </div>
          <span className="bp-avatar">{profile.name.slice(0, 1) || "N"}</span>
          <h3>{profile.name || "Tu negocio"}</h3>
          <span className="bp-category">{profile.category}</span>
          <p>{profile.bio}</p>
          <span className="bp-location">
            <MapPin size={12} />
            {profile.city || "Ciudad por definir"}
          </span>
          <div className="bp-preview-counts">
            <span>
              <strong>{profile.photos.length}</strong>fotos propias
            </span>
            <span>
              <strong>{profile.catalog.length}</strong>servicios y productos
            </span>
          </div>
          <div className="notice">
            <ShieldCheck size={17} />
            <p>
              Guardar prepara la vista cliente en este navegador. No publica el
              negocio ni comparte datos con nadie.
            </p>
          </div>
        </aside>
      </div>
      {editing && (
        <CatalogItemModal
          item={item}
          onClose={() => {
            setEditing(false);
            setItem(null);
          }}
          onSave={saveItem}
        />
      )}
    </div>
  );
}

function CatalogItemModal({
  item,
  onClose,
  onSave,
}: {
  item: CatalogItem | null;
  onClose: () => void;
  onSave: (item: CatalogItem) => void;
}) {
  const [form, setForm] = useState(
    item ?? { ...emptyItem, id: `item-${createDemoId()}` },
  );
  const [error, setError] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      setError("Añade un nombre y una descripción para este elemento.");
      return;
    }
    if (!Number.isFinite(form.price) || form.price < 0 || form.price > 100000) {
      setError("El precio orientativo debe estar entre 0 y 100.000 €.");
      return;
    }
    if (
      form.kind === "service" &&
      (!Number.isFinite(form.duration) ||
        form.duration < 15 ||
        form.duration > 480)
    ) {
      setError("La duración debe estar entre 15 y 480 minutos.");
      return;
    }
    onSave({
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      bookable: form.kind === "service" && form.bookable,
    });
  };
  return (
    <Modal
      title={item ? "Editar servicio o producto" : "Nuevo servicio o producto"}
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <label htmlFor="bp-item-title">Nombre del servicio o producto</label>
        <input
          id="bp-item-title"
          className="field"
          maxLength={80}
          required
          value={form.title}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
        />
        <div className="bp-form-columns">
          <div>
            <label htmlFor="bp-item-kind">Tipo de publicación</label>
            <select
              className="field"
              id="bp-item-kind"
              value={form.kind}
              onChange={(event) =>
                setForm({
                  ...form,
                  kind: event.target.value as "service" | "product",
                })
              }
            >
              <option value="service">Servicio</option>
              <option value="product">Producto</option>
            </select>
          </div>
          <div>
            <label htmlFor="bp-item-price">Precio orientativo (€)</label>
            <input
              className="field"
              id="bp-item-price"
              type="number"
              min={0}
              max={100000}
              step="0.01"
              required
              value={form.price}
              onChange={(event) =>
                setForm({ ...form, price: Number(event.target.value) })
              }
            />
          </div>
        </div>
        <label htmlFor="bp-item-description">Descripción</label>
        <textarea
          className="field"
          id="bp-item-description"
          maxLength={250}
          required
          value={form.description}
          onChange={(event) =>
            setForm({ ...form, description: event.target.value })
          }
        />
        {form.kind === "service" && (
          <>
            <label htmlFor="bp-item-duration">Duración (minutos)</label>
            <input
              className="field"
              id="bp-item-duration"
              type="number"
              min={15}
              max={480}
              step={5}
              required
              value={form.duration}
              onChange={(event) =>
                setForm({ ...form, duration: Number(event.target.value) })
              }
            />
            <label className="bp-consent">
              <input
                type="checkbox"
                checked={form.bookable}
                onChange={(event) =>
                  setForm({ ...form, bookable: event.target.checked })
                }
              />
              <span>Permitir solicitudes de reserva de ejemplo</span>
            </label>
          </>
        )}
        <p className="bp-booking-note">
          Este elemento sólo forma parte del catálogo ficticio de este
          navegador.
        </p>
        {error && (
          <p className="bp-form-error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button type="button" className="button secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="button primary" type="submit">
            {item ? "Guardar elemento" : "Añadir al catálogo"}
            <Check size={14} />
          </button>
        </div>
      </form>
    </Modal>
  );
}
