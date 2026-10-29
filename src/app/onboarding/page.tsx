"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  Globe2,
  Layers3,
  MapPin,
  Monitor,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  Truck,
} from "lucide-react";
import { MODULES, SECTORS, isPreviewModule, sectorById } from "@/lib/catalog";
import {
  DEFAULT_CONFIG,
  loadDemoConfig,
  saveDemoConfig,
  type BusinessMode,
  type DemoConfig,
} from "@/lib/demo";
import { ModulePicker } from "@/components/module-picker";
import { setDemoExperience } from "@/lib/experience";

const steps = ["Tu actividad", "Tus módulos", "Tu negocio", "Todo listo"];
const modes = [
  {
    value: "local",
    label: "Local físico",
    desc: "Los clientes vienen a ti",
    icon: Store,
  },
  {
    value: "mobile",
    label: "A domicilio",
    desc: "Te desplazas hasta el cliente",
    icon: Truck,
  },
  {
    value: "online",
    label: "Online",
    desc: "Tu negocio no tiene fronteras",
    icon: Monitor,
  },
  {
    value: "hybrid",
    label: "Mixto",
    desc: "Lo mejor de cada modalidad",
    icon: Globe2,
  },
] satisfies {
  value: BusinessMode;
  label: string;
  desc: string;
  icon: typeof Store;
}[];

const titles = [
  "Cada negocio es un mundo.",
  "Menos ruido. Más posibilidades.",
  "Démosle tu identidad.",
  "Tu próximo capítulo empieza aquí.",
];
const descriptions = [
  "Elige una actividad principal y, si lo necesitas, añade otras. Las plantillas comparten las mismas herramientas.",
  "Empieza con lo que necesitas. Puedes sumar o quitar herramientas cuando quieras.",
  "Un par de detalles para que este espacio se sienta tuyo. Usa datos de ejemplo en esta demo.",
  "Revisa tu configuración y descubre cómo podría ser trabajar con todo conectado.",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<DemoConfig>(DEFAULT_CONFIG);
  const [sectorQuery, setSectorQuery] = useState("");
  const [error, setError] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const firstStep = useRef(true);

  useEffect(() => {
    setForm(loadDemoConfig());
  }, []);
  useEffect(() => {
    if (firstStep.current) {
      firstStep.current = false;
      return;
    }
    heading.current?.focus();
  }, [step]);

  const update = (partial: Partial<DemoConfig>) => {
    setError("");
    setForm((current) => ({ ...current, ...partial }));
  };
  const sector = sectorById(form.sectorId);
  const sectors = SECTORS.filter((item) =>
    `${item.label} ${item.family} ${item.examples.join(" ")}`
      .toLocaleLowerCase("es")
      .includes(sectorQuery.trim().toLocaleLowerCase("es")),
  );
  const schedule = form.availability ?? {
    days: [1, 2, 3, 4, 5],
    opens: "09:00",
    closes: "18:00",
  };
  const extraActivities = form.additionalSectorIds ?? [];
  const next = () => {
    setError("");
    if (step === 2 && (!form.name.trim() || !form.city.trim())) {
      setError(
        "Añade un nombre de negocio y una ciudad o zona para continuar.",
      );
      return;
    }
    if (
      step === 2 &&
      schedule.days.length > 0 &&
      (!schedule.opens || !schedule.closes || schedule.opens >= schedule.closes)
    ) {
      setError(
        "La hora de cierre debe ser posterior a la apertura. Este horario de ejemplo contempla un solo día.",
      );
      return;
    }
    if (step < 3) {
      setStep((value) => value + 1);
      return;
    }
    try {
      const saved: unknown = saveDemoConfig({
        ...form,
        name: form.name.trim(),
        city: form.city.trim(),
      });
      if (saved === false) {
        setError(
          "No hemos podido guardar la configuración en este navegador. Activa el almacenamiento local e inténtalo de nuevo.",
        );
        return;
      }
      setDemoExperience("business");
      router.push("/demo/empresa");
    } catch {
      setError(
        "No hemos podido guardar la configuración en este navegador. Activa el almacenamiento local e inténtalo de nuevo.",
      );
    }
  };

  return (
    <div className="container nx-onboarding">
      <div className="nx-onboarding-top">
        <Link href="/" className="nx-back-link">
          <ArrowLeft size={15} /> Volver a AutonoService
        </Link>
        <span>
          <ShieldCheck size={14} /> Sin registro · Solo demostración
        </span>
      </div>
      <div className="nx-onboarding-intro">
        <p className="eyebrow">
          <Sparkles size={14} /> AUTONOSERVICE · GRATIS
        </p>
        <h1>
          Un espacio a tu medida<span>.</span>
        </h1>
        <p>
          Tu negocio. Más fácil. Configura una muestra de tu espacio
          profesional.
        </p>
      </div>
      <ol className="nx-stepper" aria-label="Progreso de configuración">
        {steps.map((label, index) => (
          <li
            key={label}
            className={
              index < step ? "is-complete" : index === step ? "is-current" : ""
            }
            aria-current={index === step ? "step" : undefined}
          >
            <span className="nx-step-number">
              {index < step ? <Check size={15} /> : `0${index + 1}`}
            </span>
            <span>{label}</span>
            {index < 3 && (
              <ChevronRight size={15} className="nx-step-chevron" />
            )}
          </li>
        ))}
      </ol>
      <div className="nx-onboarding-layout">
        <section className="nx-onboarding-form" aria-labelledby="step-title">
          <div className="nx-step-heading">
            <span>PASO 0{step + 1} / 04</span>
            <h2 id="step-title" ref={heading} tabIndex={-1}>
              {titles[step]}
            </h2>
            <p>{descriptions[step]}</p>
          </div>
          {step === 0 && (
            <>
              <label className="nx-input-label" htmlFor="sector-search">
                ¿A qué se dedica tu negocio?
              </label>
              <div className="nx-sector-search">
                <Search size={17} aria-hidden="true" />
                <input
                  id="sector-search"
                  type="search"
                  value={sectorQuery}
                  onChange={(event) => setSectorQuery(event.target.value)}
                  placeholder="Busca tu actividad: fotografía, peluquería…"
                />
              </div>
              <div
                className="nx-sector-grid"
                role="group"
                aria-label="Plantillas de actividad"
              >
                {sectors.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`nx-sector-option ${form.sectorId === item.id ? "is-selected" : ""}`}
                    aria-pressed={form.sectorId === item.id}
                    onClick={() =>
                      update({
                        sectorId: item.id,
                        offering: item.suggested.includes("products")
                          ? item.suggested.includes("services")
                            ? "both"
                            : "products"
                          : "services",
                        additionalSectorIds: extraActivities.filter(
                          (id) => id !== item.id,
                        ),
                        modules: [
                          ...new Set([
                            ...item.suggested,
                            ...extraActivities
                              .filter((id) => id !== item.id)
                              .flatMap((id) => sectorById(id).suggested),
                          ]),
                        ].filter(isPreviewModule),
                      })
                    }
                  >
                    <span className="nx-sector-symbol">
                      {item.id === "photo" ? (
                        <Camera size={19} />
                      ) : item.id === "hybrid" ? (
                        <Layers3 size={19} />
                      ) : (
                        <Building2 size={19} />
                      )}
                    </span>
                    <span>
                      <strong>{item.label}</strong>
                      <small>{item.family}</small>
                    </span>
                    <span className="nx-sector-radio" aria-hidden="true">
                      {form.sectorId === item.id && <span />}
                    </span>
                  </button>
                ))}
              </div>
              {sectors.length === 0 && (
                <div className="nx-search-empty" role="status">
                  <Search size={22} />
                  <strong>No encontramos esa actividad</strong>
                  <p>Prueba otra palabra o crea una configuración mixta.</p>
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => {
                      update({
                        sectorId: "hybrid",
                        modules: ["customers", "services"],
                      });
                      setSectorQuery("");
                    }}
                  >
                    Elegir actividad mixta
                  </button>
                </div>
              )}
              <details className="nx-additional-activities">
                <summary>
                  Actividades adicionales{" "}
                  <span>
                    {extraActivities.length
                      ? `${extraActivities.length} seleccionadas`
                      : "Opcional"}
                  </span>
                </summary>
                <p>
                  Puedes combinar hasta cuatro actividades adicionales. No se
                  crean negocios separados.
                </p>
                <div className="nx-additional-grid">
                  {SECTORS.filter((item) => item.id !== form.sectorId).map(
                    (item) => (
                      <label key={item.id}>
                        <input
                          type="checkbox"
                          checked={extraActivities.includes(item.id)}
                          disabled={
                            !extraActivities.includes(item.id) &&
                            extraActivities.length >= 4
                          }
                          onChange={(event) => {
                            const selected = event.target.checked
                              ? [...extraActivities, item.id]
                              : extraActivities.filter((id) => id !== item.id);
                            update({
                              additionalSectorIds: selected,
                              modules: event.target.checked
                                ? [
                                    ...new Set([
                                      ...form.modules,
                                      ...item.suggested,
                                    ]),
                                  ].filter(isPreviewModule)
                                : form.modules,
                            });
                          }}
                        />
                        <span>{item.label}</span>
                      </label>
                    ),
                  )}
                </div>
              </details>
              <div className="nx-offering-field">
                <label className="nx-input-label" htmlFor="business-offering">
                  ¿Qué ofreces?
                </label>
                <select
                  className="field"
                  id="business-offering"
                  value={form.offering ?? "services"}
                  onChange={(event) => {
                    const offering = event.target.value as
                      "services" | "products" | "both";
                    const modules = [...form.modules];
                    if (
                      offering !== "services" &&
                      !modules.includes("products")
                    )
                      modules.push("products");
                    if (
                      offering !== "products" &&
                      !modules.includes("services")
                    )
                      modules.push("services");
                    update({ offering, modules });
                  }}
                >
                  <option value="services">Servicios</option>
                  <option value="products">Productos</option>
                  <option value="both">Servicios y productos</option>
                </select>
                <p className="nx-fineprint">
                  Los detalles del catálogo se podrán editar desde Mi perfil.
                </p>
              </div>
              <div className="nx-mode-heading">
                <h3>¿Cómo trabajas?</h3>
                <p>Elige cómo atiendes a tus clientes.</p>
              </div>
              <div
                className="nx-mode-grid"
                role="group"
                aria-label="Modalidad de negocio"
              >
                {modes.map((mode) => (
                  <button
                    key={mode.value}
                    className={`nx-mode-card ${form.mode === mode.value ? "is-selected" : ""}`}
                    type="button"
                    aria-pressed={form.mode === mode.value}
                    onClick={() => update({ mode: mode.value })}
                  >
                    <mode.icon size={21} strokeWidth={1.5} />
                    <strong>{mode.label}</strong>
                    <small>{mode.desc}</small>
                  </button>
                ))}
              </div>
              {sector.caution && (
                <div className="notice nx-sector-caution">
                  <ShieldCheck size={19} />
                  <p>{sector.caution}</p>
                </div>
              )}
            </>
          )}
          {step === 1 && (
            <>
              <div className="nx-recommendation">
                <Sparkles size={17} />
                <span>
                  Una selección para <strong>{sector.label}</strong>. Tú tienes
                  la última palabra.
                </span>
              </div>
              <ModulePicker
                modules={form.modules}
                onChange={(modules) => update({ modules })}
                sectorId={form.sectorId}
              />
            </>
          )}
          {step === 2 && (
            <>
              <div className="nx-identity-fields">
                <label
                  className="nx-input-label"
                  htmlFor="business-entity-type"
                >
                  Tipo de profesional o empresa
                </label>
                <select
                  id="business-entity-type"
                  className="field"
                  value={form.entityType ?? "self_employed"}
                  onChange={(event) =>
                    update({
                      entityType: event.target.value as
                        "self_employed" | "company" | "team",
                    })
                  }
                >
                  <option value="self_employed">
                    Autónomo / profesional independiente
                  </option>
                  <option value="company">Empresa</option>
                  <option value="team">Equipo o negocio compartido</option>
                </select>
                <label className="nx-input-label" htmlFor="business-name">
                  Nombre de tu negocio <span>Obligatorio</span>
                </label>
                <input
                  id="business-name"
                  className="field"
                  autoComplete="organization"
                  maxLength={80}
                  placeholder="Ej. Lumen Studio"
                  value={form.name}
                  onChange={(event) => update({ name: event.target.value })}
                  aria-invalid={!!error && !form.name.trim()}
                  aria-describedby={error ? "onboarding-error" : undefined}
                />
                <label className="nx-input-label" htmlFor="business-city">
                  Ciudad o zona de actividad <span>Obligatorio</span>
                </label>
                <input
                  id="business-city"
                  className="field"
                  autoComplete="address-level2"
                  maxLength={80}
                  placeholder="Ej. Barcelona"
                  value={form.city}
                  onChange={(event) => update({ city: event.target.value })}
                  aria-invalid={!!error && !form.city.trim()}
                  aria-describedby={
                    error ? "onboarding-error" : "location-hint"
                  }
                />
                <p id="location-hint" className="nx-fineprint">
                  <MapPin size={13} /> Solo una referencia para personalizar tu
                  espacio. No pedimos una dirección.
                </p>
              </div>
              <details className="nx-additional-activities nx-operating-details">
                <summary>
                  Zona y horario orientativo <span>Personalizar</span>
                </summary>
                <div className="nx-operating-content">
                  <label className="nx-input-label" htmlFor="business-coverage">
                    Zonas de cobertura <span>Opcional</span>
                  </label>
                  <input
                    className="field"
                    id="business-coverage"
                    maxLength={160}
                    value={form.coverage ?? ""}
                    onChange={(event) =>
                      update({ coverage: event.target.value })
                    }
                    placeholder="Ej. Barcelona y alrededores, toda España u online"
                  />
                  <p className="nx-fineprint">
                    La ubicación precisa no es necesaria. Esta zona no se
                    publica ni se geolocaliza.
                  </p>
                  <fieldset className="nx-schedule-fieldset">
                    <legend>Días de trabajo de ejemplo</legend>
                    <div className="nx-day-picker">
                      {[
                        [1, "Lunes", "L"],
                        [2, "Martes", "M"],
                        [3, "Miércoles", "X"],
                        [4, "Jueves", "J"],
                        [5, "Viernes", "V"],
                        [6, "Sábado", "S"],
                        [7, "Domingo", "D"],
                      ].map(([value, label, short]) => (
                        <button
                          type="button"
                          key={value}
                          aria-label={String(label)}
                          aria-pressed={schedule.days.includes(Number(value))}
                          onClick={() =>
                            update({
                              availability: {
                                ...schedule,
                                days: schedule.days.includes(Number(value))
                                  ? schedule.days.filter((day) => day !== value)
                                  : [...schedule.days, Number(value)].sort(),
                              },
                            })
                          }
                        >
                          {short}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  <div className="nx-schedule-times">
                    <div>
                      <label
                        className="nx-input-label"
                        htmlFor="business-opens"
                      >
                        Apertura
                      </label>
                      <input
                        className="field"
                        type="time"
                        id="business-opens"
                        value={schedule.opens}
                        onChange={(event) =>
                          update({
                            availability: {
                              ...schedule,
                              opens: event.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <label
                        className="nx-input-label"
                        htmlFor="business-closes"
                      >
                        Cierre
                      </label>
                      <input
                        className="field"
                        type="time"
                        id="business-closes"
                        value={schedule.closes}
                        onChange={(event) =>
                          update({
                            availability: {
                              ...schedule,
                              closes: event.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                  <p className="nx-fineprint">
                    Sólo una preferencia local. No comprueba disponibilidad ni
                    habilita reservas reales. Los turnos partidos o nocturnos se
                    diseñarán en el módulo de agenda.
                  </p>
                </div>
              </details>
              <label className="nx-public-preference">
                <input
                  type="checkbox"
                  checked={form.publicListing}
                  onChange={(event) =>
                    update({ publicListing: event.target.checked })
                  }
                />
                <span>
                  <strong>Me interesa aparecer en el futuro directorio</strong>
                  <small>
                    Guardamos tu preferencia. Ningún perfil ni ubicación se
                    publica en esta demo.
                  </small>
                </span>
              </label>
              <div className="nx-privacy-card">
                <ShieldCheck size={25} strokeWidth={1.5} />
                <div>
                  <strong>Tu espacio empieza siendo privado.</strong>
                  <p>
                    Podrás decidir qué mostrar y a quién cuando el directorio
                    esté disponible. Ahora todo se queda en este navegador.
                  </p>
                </div>
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <div className="nx-review-business">
                <span className="nx-review-avatar">
                  {form.name.trim().slice(0, 1).toLocaleUpperCase("es") || "N"}
                </span>
                <div>
                  <h3>{form.name.trim() || "Mi negocio"}</h3>
                  <p>{sector.label}</p>
                  <small>
                    <MapPin size={13} /> {form.city.trim()} <span>·</span>{" "}
                    {modes.find((mode) => mode.value === form.mode)?.label}
                  </small>
                </div>
                <CheckCircle2 className="nx-review-check" size={24} />
              </div>
              <dl className="nx-business-review-details">
                <div>
                  <dt>Tipo</dt>
                  <dd>
                    {form.entityType === "company"
                      ? "Empresa"
                      : form.entityType === "team"
                        ? "Equipo"
                        : "Autónomo / profesional"}
                  </dd>
                </div>
                <div>
                  <dt>Oferta</dt>
                  <dd>
                    {form.offering === "both"
                      ? "Servicios y productos"
                      : form.offering === "products"
                        ? "Productos"
                        : "Servicios"}
                  </dd>
                </div>
                <div>
                  <dt>Actividades adicionales</dt>
                  <dd>
                    {extraActivities.length
                      ? extraActivities
                          .map((id) => sectorById(id).label)
                          .join(", ")
                      : "Ninguna"}
                  </dd>
                </div>
                <div>
                  <dt>Cobertura</dt>
                  <dd>{form.coverage?.trim() || form.city}</dd>
                </div>
                <div>
                  <dt>Horario de ejemplo</dt>
                  <dd>
                    {schedule.days.length
                      ? `${schedule.days.length} días · ${schedule.opens}–${schedule.closes}`
                      : "Sin horario definido"}
                  </dd>
                </div>
              </dl>
              <div className="nx-review-label">
                <h3>Tu caja de herramientas</h3>
                <span>{form.modules.length} módulos</span>
              </div>
              <div className="nx-review-modules">
                {form.modules.map((id) => (
                  <span key={id}>
                    <Check size={13} />
                    {MODULES[id].label}
                  </span>
                ))}
              </div>
              <div className="nx-review-visibility">
                <Globe2 size={18} />
                <div>
                  <strong>Perfil público desactivado</strong>
                  <p>
                    {form.publicListing
                      ? "Has indicado interés en el directorio futuro. Tu negocio no se publicará ahora."
                      : "Tu negocio no se muestra en ningún directorio."}
                  </p>
                </div>
              </div>
              {sector.caution && (
                <div className="notice nx-sector-caution">
                  <ShieldCheck size={19} />
                  <p>{sector.caution}</p>
                </div>
              )}
              <p className="nx-fineprint">
                Al entrar verás datos ficticios. Esta configuración no crea una
                empresa real ni una cuenta, y no envía reservas ni procesa
                cobros.
              </p>
            </>
          )}
          {error && (
            <p className="nx-form-error" role="alert" id="onboarding-error">
              {error}
            </p>
          )}
          <div className="nx-form-actions">
            <button
              type="button"
              className="button secondary"
              disabled={step === 0}
              onClick={() => {
                setError("");
                setStep((value) => Math.max(0, value - 1));
              }}
            >
              <ArrowLeft size={16} /> Atrás
            </button>
            <span>
              {step === 3
                ? "Todo conectado. Todo tuyo."
                : "Puedes cambiarlo más adelante"}
            </span>
            <button type="button" className="button primary" onClick={next}>
              {step === 3 ? "Abrir mi panel" : "Continuar"}
              <ArrowRight size={16} />
            </button>
          </div>
        </section>
        <aside
          className="nx-onboarding-preview"
          aria-label="Vista previa de tu espacio"
        >
          <div className="nx-preview-heading">
            <span>ASÍ VA TOMANDO FORMA</span>
            <i /> Vista previa
          </div>
          <div className="nx-preview-window">
            <div className="nx-preview-window-top">
              <i />
              <i />
              <i />
              <span>Tu espacio en AutonoService</span>
            </div>
            <div className="nx-preview-content">
              <span className="nx-preview-avatar">
                {form.name.trim().slice(0, 1).toLocaleUpperCase("es") || "N"}
              </span>
              <h3>{form.name.trim() || "Tu negocio"}</h3>
              <p>{sector.label}</p>
              <div className="nx-preview-divider" />
              <div className="nx-preview-nav">
                <span>
                  <Layers3 size={15} /> Vista general <span>⌘ 1</span>
                </span>
                {form.modules.slice(0, 5).map((id) => (
                  <span key={id}>
                    <span className="nx-preview-nav-dot" />
                    {MODULES[id].label}
                    <ChevronRight size={13} />
                  </span>
                ))}
              </div>
              <div className="nx-preview-stat">
                <span>
                  <i /> {form.modules.length} módulos conectados
                </span>
                <CheckCircle2 size={16} />
              </div>
            </div>
          </div>
          <div className="nx-preview-note">
            <span className="nx-note-icon">
              <Sparkles size={18} />
            </span>
            <h3>Crece a tu ritmo.</h3>
            <p>
              Tu negocio evoluciona. Tu espacio también. Activa nuevas
              posibilidades sin empezar de cero.
            </p>
          </div>
          <p className="nx-preview-footnote">
            <ShieldCheck size={13} /> Configuración guardada solo en este
            navegador.
          </p>
        </aside>
      </div>
    </div>
  );
}
