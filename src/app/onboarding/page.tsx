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
  "Cuéntanos a qué te dedicas. Prepararemos una selección de herramientas para tu día a día.",
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
  const next = () => {
    setError("");
    if (step === 2 && (!form.name.trim() || !form.city.trim())) {
      setError(
        "Añade un nombre de negocio y una ciudad o zona para continuar.",
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
      router.push("/empresa");
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
          <ArrowLeft size={15} /> Volver a Nexo
        </Link>
        <span>
          <ShieldCheck size={14} /> Sin registro · Solo demostración
        </span>
      </div>
      <div className="nx-onboarding-intro">
        <p className="eyebrow">
          <Sparkles size={14} /> TU NEGOCIO, TU FORMA DE TRABAJAR
        </p>
        <h1>
          Un espacio a tu medida<span>.</span>
        </h1>
        <p>Las herramientas adecuadas. Todas conectadas. Empecemos por ti.</p>
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
                        modules: item.suggested.filter(isPreviewModule),
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
              <div className="nx-mode-heading">
                <h3>¿Dónde ocurre la magia?</h3>
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
              <span>Tu espacio en Nexo</span>
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
