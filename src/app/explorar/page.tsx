"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Camera,
  CakeSlice,
  ChevronDown,
  Compass,
  Heart,
  LayoutGrid,
  MapPin,
  MapPinned,
  Search,
  Scissors,
  ShieldCheck,
  SlidersHorizontal,
  Wrench,
  X,
} from "lucide-react";
import "@/components/client-directory.css";

const businesses = [
  {
    id: "photo",
    name: "Lumen Studio",
    category: "Fotografía y vídeo",
    city: "Barcelona",
    desc: "Historias que merecen una buena imagen. Retratos, producto y proyectos audiovisuales.",
    icon: Camera,
    tone: "lilac",
    type: "Estudio creativo",
    tagline: "ENCUENTRA TU MEJOR LUZ",
    monogram: "L",
    services: ["Retratos", "Fotografía de producto", "Vídeo"],
  },
  {
    id: "beauty",
    name: "Barbería Norte",
    category: "Peluquería y estética",
    city: "Barcelona",
    desc: "Un espacio para parar y cuidarte. Cortes con personalidad y atención al detalle.",
    icon: Scissors,
    tone: "peach",
    type: "Cuidado personal",
    tagline: "TU ESTILO. TU MOMENTO.",
    monogram: "N",
    services: ["Corte", "Barbería", "Cuidado personal"],
  },
  {
    id: "bakery",
    name: "Dulce Taller",
    category: "Panadería y pastelería",
    city: "Barcelona",
    desc: "Pequeñas celebraciones, grandes sabores. Repostería y tartas hechas con mimo.",
    icon: CakeSlice,
    tone: "pink",
    type: "Obrador artesanal",
    tagline: "UN POCO MÁS DULCE",
    monogram: "d",
    services: ["Tartas", "Repostería", "Encargos"],
  },
  {
    id: "repairs",
    name: "Taller Central",
    category: "Taller y reparaciones",
    city: "Barcelona",
    desc: "Otra vida para tus cosas. Reparación y mantenimiento con un trato cercano.",
    icon: Wrench,
    tone: "sage",
    type: "Servicio técnico",
    tagline: "VOLVER A PONER EN MARCHA",
    monogram: "T",
    services: ["Reparaciones", "Mantenimiento", "Diagnóstico"],
  },
];
const FAVORITES_KEY = "nexo-demo-favorites-v1";
export default function ExplorePage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [view, setView] = useState<"list" | "map">("list");
  const [favorites, setFavorites] = useState<string[]>(["photo", "beauty"]);
  const [message, setMessage] = useState("");
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
                typeof id === "string" && businesses.some((b) => b.id === id),
            ),
          ),
        ]);
    } catch {
      /* Storage is optional for this visual demo. */
    }
  }, []);
  const filtered = businesses.filter(
    (b) =>
      (category === "all" || category === b.id) &&
      (b.name + " " + b.category + " " + b.city + " " + b.desc)
        .toLocaleLowerCase("es")
        .includes(query.toLocaleLowerCase("es")),
  );
  function toggleFavorite(id: string) {
    const next = favorites.includes(id)
      ? favorites.filter((f) => f !== id)
      : [...favorites, id];
    setFavorites(next);
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      setMessage(
        next.includes(id)
          ? "Favorito de ejemplo guardado en este navegador."
          : "Favorito de ejemplo eliminado.",
      );
    } catch {
      setMessage(
        "El navegador no permite guardar favoritos; tu selección durará esta visita.",
      );
    }
  }
  return (
    <div className="container explore-page">
      <div className="explore-intro">
        <span className="eyebrow">
          <Compass size={15} /> DESCUBRE TU PRÓXIMO FAVORITO
        </span>
        <span className="explore-prototype">
          <span /> DIRECTORIO PROTOTIPO
        </span>
        <h1>
          Buenos negocios.
          <br />
          <span>Mejores conexiones.</span>
        </h1>
        <p>
          Una primera mirada a los espacios, profesionales y experiencias
          <br className="explore-desktop-break" /> que algún día podrás
          encontrar en Nexo.
        </p>
        <div className="explore-orbit" aria-hidden="true">
          <span>✳</span>
        </div>
      </div>
      <div className="explore-demo-notice">
        <ShieldCheck size={19} />
        <p>
          <strong>Imaginamos el directorio contigo.</strong> Los cuatro negocios
          son ficticios. No hay ubicaciones, disponibilidad ni reservas reales.
        </p>
      </div>
      <div className="explore-filterbar">
        <div className="explore-search">
          <Search size={19} />
          <label htmlFor="explore-search" className="explore-sr">
            Buscar negocios
          </label>
          <input
            id="explore-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Un negocio, servicio o ciudad…"
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Limpiar búsqueda">
              <X size={16} />
            </button>
          )}
        </div>
        <label className="explore-category">
          <SlidersHorizontal size={16} />
          <span className="explore-sr">Filtrar por sector</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">Todos los sectores</option>
            {businesses.map((b) => (
              <option value={b.id} key={b.id}>
                {b.category}
              </option>
            ))}
          </select>
          <ChevronDown size={14} />
        </label>
        <div className="explore-view-toggle" aria-label="Vista del directorio">
          <button
            className={view === "list" ? "active" : ""}
            aria-pressed={view === "list"}
            onClick={() => setView("list")}
          >
            <LayoutGrid size={16} />
            <span>Lista</span>
          </button>
          <button
            className={view === "map" ? "active" : ""}
            aria-pressed={view === "map"}
            onClick={() => setView("map")}
          >
            <MapPinned size={16} />
            <span>Mapa futuro</span>
          </button>
        </div>
      </div>
      <div
        className="explore-results-heading"
        aria-live="polite"
        aria-atomic="true"
      >
        <h2>
          {view === "list" ? "Negocios de ejemplo" : "Una visión del futuro"}{" "}
          <span>{view === "list" ? `(${filtered.length})` : ""}</span>
        </h2>
        <span>Sin datos reales</span>
      </div>
      {view === "map" ? (
        <section className="explore-map-placeholder">
          <div className="explore-map-lines" aria-hidden="true" />
          <div className="explore-map-copy">
            <span className="explore-map-icon">
              <MapPinned size={30} />
            </span>
            <span className="eyebrow">EN EL HORIZONTE</span>
            <h2>
              Las conexiones también
              <br />
              tendrán un lugar.
            </h2>
            <p>
              El mapa llegará cuando existan negocios con ubicaciones
              verificadas y publicadas con su consentimiento. Esta vista no
              contiene pines ni direcciones ficticias.
            </p>
            <button
              className="button secondary"
              onClick={() => setView("list")}
            >
              Volver a los ejemplos <ArrowRight size={16} />
            </button>
          </div>
        </section>
      ) : (
        <div className="explore-business-grid">
          {filtered.map((b) => {
            const Icon = b.icon;
            return (
              <article className="explore-business" key={b.id}>
                <div className={`explore-business-art ${b.tone}`}>
                  <span className="explore-art-label">{b.type}</span>
                  <span className="explore-art-monogram" aria-hidden="true">
                    {b.monogram}
                  </span>
                  <span className="explore-art-circle" aria-hidden="true" />
                  <Icon
                    className="explore-art-icon"
                    size={62}
                    strokeWidth={1}
                  />
                  <span className="explore-art-tagline">{b.tagline}</span>
                  <button
                    className={`explore-favorite ${favorites.includes(b.id) ? "saved" : ""}`}
                    aria-pressed={favorites.includes(b.id)}
                    aria-label={`${favorites.includes(b.id) ? "Quitar de favoritos" : "Guardar en favoritos"}: ${b.name}`}
                    onClick={() => toggleFavorite(b.id)}
                  >
                    <Heart size={17} />
                  </button>
                </div>
                <div className="explore-business-copy">
                  <div className="explore-business-category">
                    <span>{b.category}</span>
                    <span>FICTICIO</span>
                  </div>
                  <h3>{b.name}</h3>
                  <p>{b.desc}</p>
                  <div className="explore-business-location">
                    <MapPin size={13} /> {b.city}
                    <span>· Ciudad ilustrativa</span>
                  </div>
                  <details>
                    <summary>
                      Ver perfil de ejemplo <ArrowRight size={16} />
                    </summary>
                    <div className="explore-profile-preview">
                      <strong>Servicios de muestra</strong>
                      <div>
                        {b.services.map((s) => (
                          <span key={s}>{s}</span>
                        ))}
                      </div>
                      <p>
                        Esta tarjeta ilustra un futuro perfil público. No
                        representa un negocio real y no permite enviar
                        solicitudes ni reservas.
                      </p>
                    </div>
                  </details>
                </div>
              </article>
            );
          })}
        </div>
      )}
      {view === "list" && filtered.length === 0 && (
        <div className="explore-empty">
          <Search size={30} />
          <h3>Aún no tenemos ese ejemplo.</h3>
          <p>Prueba con fotografía, peluquería, pastelería o reparaciones.</p>
          <button
            className="button secondary"
            onClick={() => {
              setCategory("all");
              setQuery("");
            }}
          >
            Restablecer filtros
          </button>
        </div>
      )}
      <p className="explore-feedback" role="status">
        {message}
      </p>
      <section className="explore-business-cta">
        <div>
          <span className="eyebrow">EL OTRO LADO DE NEXO</span>
          <h2>Tu negocio, a tu manera.</h2>
          <p>Explora las herramientas que se adaptan a tu actividad.</p>
        </div>
        <Link className="button primary" href="/onboarding">
          Diseñar mi espacio <ArrowRight size={17} />
        </Link>
      </section>
      <p className="personal-disclaimer">
        <ShieldCheck size={14} /> Prototipo Hito 0 · Sin mapa, cuentas,
        ubicaciones verificadas ni operaciones reales.
      </p>
    </div>
  );
}
