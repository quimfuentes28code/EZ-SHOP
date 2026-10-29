"use client";
import { usePathname } from "next/navigation";
import { Brand } from "./brand";
import { ExperienceSwitcher } from "./experience-switcher";
import { ThemeToggle } from "./theme-toggle";
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  if (path === "/empresa") return <>{children}</>;
  const realAccountArea = path === "/real" || path.startsWith("/registro/empresa") || path.startsWith("/registro/cliente");
  return (
    <>
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>
      <header className="site-header">
        <div className="container header-inner">
          <Brand />
          <div className="header-controls">
            <ExperienceSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main id="main-content">{children}</main>
      <footer className="site-footer container">
        <Brand />
        <p>Tu negocio. Más fácil.</p>
        <span>{realAccountArea ? "Cuentas conectadas · Herramientas en desarrollo" : "Pantallas de demostración y funcionalidades en desarrollo"}</span>
      </footer>
    </>
  );
}
