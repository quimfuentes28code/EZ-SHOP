import type { Metadata } from "next";
import Link from "next/link";
import { Aperture, Building2, Compass, UserRound } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexo | Software modular para negocios — Demo",
  description: "Prototipo navegable de una plataforma modular de gestión para negocios y clientes.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es"><body>
      <header className="site-header">
        <div className="container header-inner">
          <Link href="/" className="brand"><span className="brand-icon"><Aperture size={19}/></span><span>Nexo<span className="brand-dot">.</span></span><span className="demo-pill">PROTOTIPO</span></Link>
          <nav className="header-nav" aria-label="Navegación principal">
            <Link href="/onboarding"><Building2 size={16}/> <span>Crear negocio</span></Link>
            <Link href="/empresa"><Aperture size={16}/> <span>Mi negocio</span></Link>
            <Link href="/explorar"><Compass size={16}/> <span>Explorar</span></Link>
            <Link href="/cliente"><UserRound size={16}/> <span>Cliente</span></Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="site-footer container">Prototipo interactivo · Datos ficticios · Sin cuentas, reservas ni cobros reales</footer>
    </body></html>
  );
}
