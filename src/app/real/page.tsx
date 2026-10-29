import Link from "next/link";
import { Building2, UserRound, ArrowRight } from "lucide-react";
import "./real.css";

export default function ChooseAccountPage() {
  return (
    <main className="container live-app">
      <header className="live-top"><div>
        <span className="eyebrow">AUTONOSERVICE</span>
        <h1>Elige tu tipo de cuenta</h1>
        <p>Empresa y Cliente son cuentas independientes, con funciones y permisos distintos.</p>
      </div></header>
      <div className="live-grid">
        <section className="live-card">
          <Building2 size={26} color="#a47b53"/>
          <h2>AutonoService · Empresa</h2>
          <p>Gestiona tu negocio, tus servicios, solicitudes y fichas CRM.</p>
          <Link className="button primary" href="/registro/empresa">Crear cuenta Empresa <ArrowRight size={17}/></Link>
        </section>
        <section className="live-card">
          <UserRound size={26} color="#a47b53"/>
          <h2>Cliente</h2>
          <p>Descubre servicios y consulta el estado de tus solicitudes. Siempre gratis.</p>
          <Link className="button secondary" href="/registro/cliente">Crear cuenta Cliente <ArrowRight size={17}/></Link>
        </section>
      </div>
    </main>
  );
}
