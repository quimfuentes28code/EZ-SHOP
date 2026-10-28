import type { Metadata } from "next";
import { SiteChrome } from "@/components/site-chrome";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexo | Software modular para negocios — Demo",
  description:
    "Prototipo navegable de una plataforma modular de gestión para negocios y clientes.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
