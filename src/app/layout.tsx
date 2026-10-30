import type { Metadata } from "next";
import { SiteChrome } from "@/components/site-chrome";
import "./globals.css";
import "./visual-identity.css";

export const metadata: Metadata = {
  title: "AutonoService — Tu negocio. Más fácil.",
  description:
    "AutonoService: gestión modular para profesionales y experiencia Cliente gratuita. Prototipo de arquitectura y navegación.",
  robots: { index: false, follow: false },
  applicationName: "AutonoService",
  manifest: "/manifest.webmanifest",
  icons: {
    // Safari / iOS home screen. The SVG favicon remains in src/app/icon.svg.
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "AutonoService",
    statusBarStyle: "default",
  },
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
