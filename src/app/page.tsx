import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Blocks,
  Camera,
  Check,
  ChevronRight,
  Circle,
  Command,
  Layers3,
  Scissors,
  ShieldCheck,
  Sparkles,
  Store,
  UsersRound,
} from "lucide-react";
import "./home.css";

export default function HomePage() {
  return (
    <div className="container home">
      <section className="home-hero">
        <div className="hero-intro">
          <div className="hero-label">
            <span /> MENOS HERRAMIENTAS. MÁS POSIBILIDADES.
          </div>
          <h1>
            Tu negocio es único.
            <br />
            Tu espacio de trabajo,
            <br />
            <em>también.</em>
          </h1>
          <p>
            Conecta lo que haces con todo lo que necesitas.
            <br className="desktop-br" /> Clientes, proyectos, reservas y mucho
            más.
            <br className="desktop-br" /> Un solo lugar. A tu manera.
          </p>
          <div className="hero-actions">
            <Link href="/onboarding" className="button primary">
              Diseñar mi espacio <ArrowUpRight size={17} />
            </Link>
            <Link href="/empresa" className="hero-demo">
              Explorar la demo <ArrowRight size={15} />
            </Link>
          </div>
          <div className="hero-footnote">
            <ShieldCheck size={14} /> Sin registro. Sin tarjeta. Solo
            posibilidades.
          </div>
        </div>
        <div className="hero-visual" aria-label="Ejemplo de panel modular Nexo">
          <div className="visual-orbit orbit-one" />
          <div className="visual-orbit orbit-two" />
          <div className="floating-label label-project">
            <span className="tiny-icon">
              <Layers3 size={15} />
            </span>
            <div>
              <strong>Campaña de marca</strong>
              <small>
                Proyecto en marcha <span>●</span>
              </small>
            </div>
            <span className="mini-avatars">LM</span>
          </div>
          <div className="mini-dashboard">
            <div className="mini-top">
              <Command size={19} />
              <span>Tu espacio, conectado</span>
              <span className="mini-live">DEMO</span>
            </div>
            <div className="mini-greeting">
              <small>VISTA GENERAL</small>
              <h2>
                Un buen día para crear<span>.</span>
              </h2>
            </div>
            <div className="mini-stats">
              <div>
                <small>Proyectos activos</small>
                <strong>
                  08 <span>↗ 12%</span>
                </strong>
              </div>
              <div>
                <small>Clientes conectados</small>
                <strong>
                  128 <span>+8 este mes</span>
                </strong>
              </div>
            </div>
            <div className="mini-chart">
              <div>
                <span>Tu actividad</span>
                <small>Esta semana</small>
              </div>
              <svg
                viewBox="0 0 400 100"
                role="img"
                aria-label="Gráfico ilustrativo de actividad creciente"
              >
                <defs>
                  <linearGradient id="home-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c5f277" stopOpacity=".22" />
                    <stop offset="100%" stopColor="#c5f277" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 90C30 90 35 60 60 65S100 85 130 55S170 65 195 40S240 65 270 30S310 35 340 15S370 26 400 4V100H0Z"
                  fill="url(#home-fill)"
                />
                <path
                  d="M0 90C30 90 35 60 60 65S100 85 130 55S170 65 195 40S240 65 270 30S310 35 340 15S370 26 400 4"
                  fill="none"
                  stroke="#c5f277"
                  strokeWidth="2"
                />
              </svg>
              <div className="mini-chart-labels">
                <span>L</span>
                <span>M</span>
                <span>X</span>
                <span>J</span>
                <span>V</span>
                <span>S</span>
                <span>D</span>
              </div>
            </div>
            <div className="mini-task">
              <span className="mini-task-check">
                <Check size={12} />
              </span>
              Un nuevo cliente. Una nueva oportunidad.
              <ChevronRight size={13} />
            </div>
          </div>
          <div className="floating-label label-modules">
            <span className="tiny-icon">
              <Blocks size={17} />
            </span>
            <div>
              <strong>Hecho a tu medida</strong>
              <small>Activa solo lo que necesitas</small>
            </div>
            <span className="mini-toggle" />
          </div>
        </div>
      </section>
      <section className="home-sectors" aria-label="Sectores de ejemplo">
        <span>Un nexo para cada forma de trabajar</span>
        <div>
          <span>
            <Camera size={17} /> Estudios creativos
          </span>
          <span>
            <Scissors size={17} /> Belleza y bienestar
          </span>
          <span>
            <Store size={17} /> Comercio local
          </span>
          <span>
            <Layers3 size={17} /> Servicios profesionales
          </span>
        </div>
      </section>
      <section className="home-features">
        <div className="section-intro">
          <div>
            <div className="eyebrow">EL ORDEN QUE NECESITAS</div>
            <h2>
              Menos ruido.
              <br />
              Más espacio para tu negocio.
            </h2>
          </div>
          <p>
            Empieza con lo esencial. Añade herramientas
            <br />
            cuando las necesites. Todo sigue conectado.
          </p>
        </div>
        <div className="feature-grid">
          <article>
            <span className="feature-number">01 /</span>
            <Blocks size={27} />
            <h3>Un espacio que se adapta.</h3>
            <p>
              Citas, pedidos, presupuestos o proyectos. Combina módulos sin
              cambiar tu forma de trabajar.
            </p>
            <Link href="/onboarding">
              Encuentra tus herramientas <ArrowRight size={14} />
            </Link>
          </article>
          <article>
            <span className="feature-number">02 /</span>
            <UsersRound size={27} />
            <h3>Relaciones, no registros.</h3>
            <p>
              Una experiencia para tu negocio y otra para tus clientes.
              Conectadas, con su propio espacio.
            </p>
            <Link href="/cliente">
              Conoce la cuenta cliente <ArrowRight size={14} />
            </Link>
          </article>
          <article>
            <span className="feature-number">03 /</span>
            <Sparkles size={27} />
            <h3>Lo importante, a la vista.</h3>
            <p>
              Tu actividad, tus prioridades y tu próximo paso. Un panel pensado
              para hacer tu día más sencillo.
            </p>
            <Link href="/empresa">
              Entra en el panel demo <ArrowRight size={14} />
            </Link>
          </article>
        </div>
      </section>
      <section className="home-callout">
        <div>
          <span className="eyebrow">
            <Circle size={9} /> EL COMIENZO DE ALGO GRANDE
          </span>
          <h2>Todo empieza con un nexo.</h2>
          <p>Descubre cómo se siente tener tu negocio en orden.</p>
        </div>
        <Link href="/onboarding" className="button primary">
          Vamos a crear tu espacio <ArrowUpRight size={17} />
        </Link>
      </section>
      <p className="home-disclaimer">
        Vista previa del Hito 0 · Todas las cifras y negocios son ficticios. No
        se crean cuentas ni se envían reservas.
      </p>
    </div>
  );
}
