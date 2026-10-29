"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeftRight } from "lucide-react";
import {
  DEMO_ORGANIZATIONS,
  EXPERIENCE_EVENT,
  ORGANIZATION_EVENT,
  loadActiveOrganization,
  loadDemoExperience,
  setDemoExperience,
  switchDemoOrganization,
  type DemoExperience,
  type DemoOrganizationId,
} from "@/lib/experience";
import { loadDemoConfig } from "@/lib/demo";
import "./experience-switcher.css";

export function ExperienceSwitcher() {
  const path = usePathname(),
    router = useRouter();
  const [mode, setMode] = useState<DemoExperience>("business");
  const [error, setError] = useState("");
  useEffect(() => {
    const refresh = () => setMode(loadDemoExperience());
    const routeMode =
      path.startsWith("/demo/empresa") ||
      path === "/mi-plan" ||
      path === "/onboarding"
        ? "business"
        : path === "/demo/cliente" ||
            path === "/explorar" ||
            path.startsWith("/negocio/") ||
            path === "/registro"
          ? "customer"
          : null;
    const effectiveMode =
      path === "/mensajes"
        ? new URLSearchParams(window.location.search).get("como") === "empresa"
          ? "business"
          : "customer"
        : routeMode;
    if (effectiveMode) {
      setMode(effectiveMode);
      setDemoExperience(effectiveMode);
    } else refresh();
    window.addEventListener(EXPERIENCE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(EXPERIENCE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [path]);
  // Never show the demo experience switcher on real authenticated account screens.
  if (path === "/real" || path === "/empresa" || path === "/cliente" || path.startsWith("/registro/empresa") || path.startsWith("/registro/cliente")) {
    return null;
  }
  return (
    <div className="experience-control">
      <label className="experience-select">
        <ArrowLeftRight size={15} />
        <span className="sr-only">Experiencia</span>
        <select
          aria-label="Experiencia"
          value={mode}
          onChange={(event) => {
            const next = event.target.value as DemoExperience;
            setMode(next);
            const ok = setDemoExperience(next);
            setError(
              ok
                ? ""
                : "El cambio funcionará esta vez, pero no se puede recordar en este navegador.",
            );
            // Keep prototype navigation inside its isolated demo context.
            // On the homepage the same switch opens the authenticated product.
            const inDemo =
              path.startsWith("/demo/") ||
              path === "/explorar" ||
              path === "/mensajes" ||
              path.startsWith("/negocio/") ||
              path === "/mi-plan" ||
              path === "/onboarding";
            router.push(
              inDemo
                ? (next === "business" ? "/demo/empresa" : "/demo/cliente")
                : (next === "business" ? "/empresa" : "/cliente"),
            );
          }}
        >
          <option value="business">Mi negocio</option>
          <option value="customer">Modo cliente</option>
        </select>
      </label>
      {error && <small role="status">{error}</small>}
    </div>
  );
}

export function OrganizationSwitcher({ name }: { name?: string } = {}) {
  const [active, setActive] = useState<DemoOrganizationId>("photo");
  const [currentName, setCurrentName] = useState("Lumen Studio");
  const [error, setError] = useState("");
  useEffect(() => {
    const refresh = () => {
      setActive(loadActiveOrganization());
      setCurrentName(loadDemoConfig().name);
    };
    refresh();
    window.addEventListener(ORGANIZATION_EVENT, refresh);
    return () => window.removeEventListener(ORGANIZATION_EVENT, refresh);
  }, []);
  return (
    <div className="organization-control">
      <label htmlFor="active-organization">Negocio de demostración</label>
      <select
        id="active-organization"
        aria-label="Empresa activa"
        value={active}
        onChange={(event) => {
          const next = event.target.value as DemoOrganizationId;
          const ok = switchDemoOrganization(next);
          setError(
            ok
              ? ""
              : "No se ha podido cambiar de empresa. El almacenamiento está bloqueado.",
          );
          if (ok) {
            setActive(next);
            setCurrentName(loadDemoConfig().name);
          }
        }}
      >
        {DEMO_ORGANIZATIONS.map((organization) => (
          <option key={organization.id} value={organization.id}>
            {organization.id === active
              ? (name ?? currentName)
              : organization.name}
          </option>
        ))}
      </select>
      {error && <small role="alert">{error}</small>}
    </div>
  );
}
