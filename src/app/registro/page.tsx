"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Compass,
  Heart,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  loadCustomerProfile,
  saveCustomerProfile,
  setDemoExperience,
} from "@/lib/experience";
import { SECTORS } from "@/lib/catalog";
import "@/components/onboarding.css";

const interests = [...new Set(SECTORS.map((sector) => sector.family))].slice(
  0,
  12,
);

export default function CustomerRegistrationPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [understood, setUnderstood] = useState(false);
  const [error, setError] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const firstStep = useRef(true);
  useEffect(() => {
    const profile = loadCustomerProfile();
    setName(profile.name);
    setCity(profile.city);
    setSelectedInterests(profile.interests);
  }, []);
  useEffect(() => {
    if (firstStep.current) {
      firstStep.current = false;
      return;
    }
    heading.current?.focus();
  }, [step]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Indica cómo quieres que te llamemos en esta demostración.");
      return;
    }
    if (step === 0) {
      setStep(1);
      return;
    }
    if (!understood) {
      setError(
        "Confirma que entiendes que estás preparando un perfil de demostración.",
      );
      return;
    }
    if (
      !saveCustomerProfile({
        name: name.trim(),
        city: city.trim(),
        interests: selectedInterests,
      })
    ) {
      setError(
        "No se ha podido guardar el perfil en este navegador. Revisa que el almacenamiento local esté disponible e inténtalo de nuevo.",
      );
      return;
    }
    setDemoExperience("customer");
    router.push("/demo/cliente");
  };

  return (
    <div className="container nx-customer-registration">
      <Link href="/" className="nx-back-link">
        <ArrowLeft size={15} />
        Cambiar experiencia
      </Link>
      <div className="nx-customer-intro">
        <span className="eyebrow">CLIENTE · COMPLETAMENTE GRATIS</span>
        <h1>
          Todo lo que necesitas,
          <br />
          en tu espacio.
        </h1>
        <p>
          Descubre negocios, consulta sus servicios y reúne tu actividad en un
          mismo lugar.
        </p>
      </div>
      <div className="nx-customer-layout">
        <section
          className="nx-onboarding-form"
          aria-labelledby="customer-step-title"
        >
          <ol
            className="nx-customer-progress"
            aria-label="Progreso del perfil Cliente"
          >
            <li
              aria-current={step === 0 ? "step" : undefined}
              className={step === 0 ? "is-current" : "is-complete"}
            >
              <span>{step === 1 ? <Check size={13} /> : "01"}</span>Tu perfil
            </li>
            <li
              aria-current={step === 1 ? "step" : undefined}
              className={step === 1 ? "is-current" : ""}
            >
              <span>02</span>Tus preferencias
            </li>
          </ol>
          <h2 id="customer-step-title" ref={heading} tabIndex={-1}>
            {step === 0
              ? "¿Cómo quieres que te llamemos?"
              : "Un espacio con tus intereses."}
          </h2>
          <p className="nx-customer-step-copy">
            {step === 0
              ? "Usa un nombre y una ciudad de ejemplo para revisar la experiencia."
              : "Elige lo que te interesa. Podrás cambiarlo después y buscar otros servicios cuando quieras."}
          </p>
          <form onSubmit={submit} noValidate>
            {step === 0 ? (
              <>
                <label className="nx-input-label" htmlFor="customer-name">
                  Nombre para mostrar <span>Obligatorio</span>
                </label>
                <input
                  className="field"
                  id="customer-name"
                  value={name}
                  maxLength={80}
                  autoComplete="given-name"
                  onChange={(event) => {
                    setName(event.target.value);
                    setError("");
                  }}
                  placeholder="Ej. Alex"
                  aria-invalid={!!error && !name.trim()}
                  aria-describedby={
                    error ? "customer-registration-error" : undefined
                  }
                />
                <label className="nx-input-label" htmlFor="customer-city">
                  Ciudad de búsqueda <span>Opcional</span>
                </label>
                <input
                  className="field"
                  id="customer-city"
                  value={city}
                  maxLength={80}
                  autoComplete="address-level2"
                  onChange={(event) => setCity(event.target.value)}
                  placeholder="Ej. Barcelona"
                />
                <p className="nx-fineprint">
                  <ShieldCheck size={14} />
                  Puedes buscar por ciudad sin compartir tu ubicación precisa.
                  Esta pantalla no solicita geolocalización.
                </p>
              </>
            ) : (
              <>
                <div
                  className="nx-customer-interests"
                  role="group"
                  aria-label="Intereses del perfil Cliente"
                >
                  {interests.map((interest) => (
                    <button
                      type="button"
                      key={interest}
                      aria-pressed={selectedInterests.includes(interest)}
                      disabled={
                        !selectedInterests.includes(interest) &&
                        selectedInterests.length >= 8
                      }
                      onClick={() =>
                        setSelectedInterests((current) =>
                          current.includes(interest)
                            ? current.filter((value) => value !== interest)
                            : [...current, interest].slice(0, 8),
                        )
                      }
                    >
                      {selectedInterests.includes(interest) && (
                        <Check size={13} />
                      )}
                      {interest}
                    </button>
                  ))}
                </div>
                <p className="nx-fineprint">
                  Selecciona hasta 8 intereses o continúa sin elegir ninguno.
                </p>
                <label className="nx-public-preference">
                  <input
                    type="checkbox"
                    checked={understood}
                    onChange={(event) => {
                      setUnderstood(event.target.checked);
                      setError("");
                    }}
                  />
                  <span>
                    <strong>
                      Entiendo que este perfil es una demostración local
                    </strong>
                    <small>
                      Los datos se guardan sólo en este navegador. No se crea
                      una cuenta real ni se envían reservas o mensajes a otros
                      usuarios.
                    </small>
                  </span>
                </label>
              </>
            )}
            {error && (
              <p
                className="nx-form-error"
                role="alert"
                id="customer-registration-error"
              >
                {error}
              </p>
            )}
            <div className="nx-form-actions">
              {step === 1 ? (
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => {
                    setStep(0);
                    setError("");
                  }}
                >
                  <ArrowLeft size={15} />
                  Atrás
                </button>
              ) : (
                <Link href="/" className="button secondary">
                  Cambiar opción
                </Link>
              )}
              <button type="submit" className="button primary">
                {step === 0 ? "Continuar" : "Abrir modo Cliente"}
                <ArrowRight size={15} />
              </button>
            </div>
          </form>
        </section>
        <aside className="nx-customer-benefits">
          <span className="nx-customer-benefit-icon">
            <UserRound size={28} />
          </span>
          <h2>
            Una cuenta.
            <br />
            Dos formas de usarla.
          </h2>
          <p>
            Cliente forma parte de AutonoService. En el producto real podrás
            gestionar un negocio y contratar servicios con la misma identidad.
          </p>
          <ul>
            <li>
              <Compass size={18} />
              <span>
                <strong>Explora a tu manera</strong>Negocios, servicios y
                productos en sus perfiles de demostración.
              </span>
            </li>
            <li>
              <Heart size={18} />
              <span>
                <strong>Guarda tus favoritos</strong>Reúne negocios que te
                interesan en este navegador.
              </span>
            </li>
            <li>
              <ShieldCheck size={18} />
              <span>
                <strong>Cliente siempre gratis</strong>AutonoSuite mejora las
                herramientas profesionales; no es necesaria para usar Cliente.
              </span>
            </li>
          </ul>
          <div className="notice">
            <ShieldCheck size={18} />
            <p>
              Este registro es un prototipo visual. La autenticación y la
              vinculación segura de datos se implementarán en el Hito 1.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
