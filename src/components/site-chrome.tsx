"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Building2, Compass, UserRound } from "lucide-react";
import { Brand } from "./brand";
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  if (path === "/empresa") return <>{children}</>;
  return (
    <>
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>
      <header className="site-header">
        <div className="container header-inner">
          <Brand />
          <nav aria-label="Navegación principal">
            <Link href="/empresa" aria-label="Para empresas">
              <Building2 size={16} />
              <span>Para empresas</span>
            </Link>
            <Link
              href="/cliente"
              aria-label="Para clientes"
              className={path === "/cliente" ? "active" : ""}
            >
              <UserRound size={16} />
              <span>Para clientes</span>
            </Link>
            <Link
              href="/explorar"
              aria-label="Explorar"
              className={path === "/explorar" ? "active" : ""}
            >
              <Compass size={16} />
              <span>Explorar</span>
            </Link>
          </nav>
          <Link href="/onboarding" className="button secondary header-cta">
            Crear mi espacio <ArrowUpRight size={15} />
          </Link>
        </div>
      </header>
      <main id="main-content">{children}</main>
      <footer className="site-footer container">
        <Brand />
        <p>Todo tu negocio. Un solo nexo.</p>
        <span>Hito 0 · Prototipo con datos ficticios</span>
      </footer>
    </>
  );
}
