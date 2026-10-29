"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Check,
  Layers3,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import {
  EXPERIENCE_STORAGE_KEY,
  loadDemoExperience,
  setDemoExperience,
  type DemoExperience,
} from "@/lib/experience";
import "./home.css";

export default function HomePage() {
  const [last, setLast] = useState<DemoExperience | null>(null);
  useEffect(() => {
    try {
      if (window.localStorage.getItem(EXPERIENCE_STORAGE_KEY))
        setLast(loadDemoExperience());
    } catch {
      /* The chooser works without storage. */
    }
  }, []);
  return (
    <div className="container home">
      <section className="experience-intro">
        <span className="eyebrow">
          <span className="intro-dot" /> UNA CUENTA. TU FORMA DE USARLA.
        </span>
        <h1>
          ¿Cómo quieres utilizar
          <br />
          <span>AutonoService?</span>
        </h1>
        <p>Tu negocio. Más fácil.</p>
        <span className="intro-prototype">
          <ShieldCheck size={14} /> Prototipo navegable · Sin registro real
        </span>
      </section>
      <section className="experience-options" aria-label="Elige tu experiencia">
        <article className="experience-option professional-option">
          <div className="experience-option-top">
            <span className="experience-option-icon">
              <Building2 size={29} strokeWidth={1.5} />
            </span>
            <span className="experience-tier">PARA TU NEGOCIO</span>
          </div>
          <h2>AutonoService</h2>
          <p>
            Gestiona tu negocio, organiza tus clientes, simplifica tus tareas y
            consigue nuevas oportunidades.
          </p>
          <ul>
            <li>
              <Check size={15} />
              Las herramientas que encajan con tu actividad
            </li>
            <li>
              <Check size={15} />
              Un perfil para mostrar lo que haces
            </li>
            <li>
              <Check size={15} />
              Clientes, conversaciones y trabajos conectados
            </li>
          </ul>
          <span className="experience-price">
            Gratis <span>· Mejora disponible con AutonoSuite</span>
          </span>
          <Link
            className="button primary"
            aria-label="Empezar con AutonoService"
            href="/onboarding"
            onClick={() => setDemoExperience("business")}
          >
            Empezar con AutonoService <ArrowUpRight size={17} />
          </Link>
          <Link
            className="experience-demo-link"
            href="/empresa"
            onClick={() => setDemoExperience("business")}
          >
            Ver el negocio de demostración <ArrowRight size={14} />
          </Link>
        </article>
        <article className="experience-option customer-option">
          <div className="experience-option-top">
            <span className="experience-option-icon">
              <UserRound size={29} strokeWidth={1.5} />
            </span>
            <span className="experience-tier">PARA TI</span>
          </div>
          <h2>Cliente</h2>
          <p>
            Descubre negocios cercanos, reserva servicios y gestiona todas tus
            contrataciones desde un solo lugar.
          </p>
          <ul>
            <li>
              <Check size={15} />
              Descubre negocios y conoce lo que ofrecen
            </li>
            <li>
              <Check size={15} />
              Consulta servicios, productos y perfiles
            </li>
            <li>
              <Check size={15} />
              Toda tu actividad, en un mismo espacio
            </li>
          </ul>
          <span className="experience-price">Completamente gratis</span>
          <Link
            className="button secondary"
            aria-label="Empezar como Cliente"
            href="/registro"
            onClick={() => setDemoExperience("customer")}
          >
            Empezar como Cliente <ArrowUpRight size={17} />
          </Link>
          <Link
            className="experience-demo-link"
            href="/cliente"
            onClick={() => setDemoExperience("customer")}
          >
            Explorar la experiencia Cliente <ArrowRight size={14} />
          </Link>
        </article>
      </section>
      <section className="real-phase-entry" aria-label="Cuentas conectadas">
        <div>
          <strong>Próxima fase: cuentas reales y CRM conectado</strong>
          <p>Regístrate, crea tu negocio y recibe solicitudes de personas registradas. La activación requiere conectar el backend seguro.</p>
        </div>
        <Link href="/real" className="button secondary">Acceder a la fase real <ArrowRight size={15} /></Link>
      </section>
      <div className="one-account-note">
        <Layers3 size={21} />
        <div>
          <strong>Las dos experiencias. Una misma cuenta.</strong>
          <p>
            Puedes gestionar tu negocio y reservar en otros. Cambia cuando
            quieras entre «Mi negocio» y «Modo cliente».
          </p>
        </div>
      </div>
      {last && (
        <div className="resume-experience">
          <span>
            Tu última experiencia:{" "}
            <strong>
              {last === "business" ? "Mi negocio" : "Modo cliente"}
            </strong>
          </span>
          <Link href={last === "business" ? "/empresa" : "/cliente"}>
            Continuar donde estabas <ArrowRight size={14} />
          </Link>
        </div>
      )}
      <section className="home-simple-features" aria-label="Todo conectado">
        <div>
          <MessageCircle size={21} />
          <h3>Hablar. Compartir. Resolver.</h3>
          <p>La conversación y los archivos de cada trabajo, juntos.</p>
        </div>
        <div>
          <Building2 size={21} />
          <h3>Tu perfil, de cara al cliente.</h3>
          <p>Fotos, productos y servicios en el mismo lugar.</p>
        </div>
        <div>
          <Sparkles size={21} />
          <h3>Más opciones cuando las necesites.</h3>
          <p>AutonoSuite mejora tu gestión sin crear otra cuenta.</p>
        </div>
      </section>
      <p className="home-disclaimer">
        Vista previa del Hito 0. Negocios ficticios, solicitudes locales y
        funciones previstas. No se envían reservas, mensajes ni cobros reales.
      </p>
    </div>
  );
}
