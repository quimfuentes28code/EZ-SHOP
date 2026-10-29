import type { Metadata } from "next";
import { SiteChrome } from "@/components/site-chrome";
import "./globals.css";
import "./visual-identity.css";

export const metadata: Metadata = {
  title: "AutonoService — Tu negocio. Más fácil.",
  description:
    "AutonoService: gestión modular para profesionales y experiencia Cliente gratuita. Prototipo de arquitectura y navegación.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" data-theme="light">
      <body>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
