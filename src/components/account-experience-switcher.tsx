"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight } from "lucide-react";
import "./account-experience-switcher.css";

export const ACCOUNT_EXPERIENCE_STORAGE_KEY = "autonoservice-account-experience-v1";

export function AccountExperienceSwitcher({
  experience,
}: {
  experience: "business" | "customer";
}) {
  const router = useRouter();

  useEffect(() => {
    try {
      // This records a display preference only. Database permissions still
      // determine whether the account can use the selected workspace.
      window.localStorage.setItem(ACCOUNT_EXPERIENCE_STORAGE_KEY, experience);
    } catch {
      // Switching experience remains available when browser storage is blocked.
    }
  }, [experience]);

  return (
    <label className="account-experience-switcher">
      <ArrowLeftRight size={17} aria-hidden="true" />
      <span className="sr-only">Cambiar experiencia de la cuenta</span>
      <select
        aria-label="Cambiar experiencia de la cuenta"
        value={experience}
        onChange={(event) => {
          const next = event.target.value;
          if (next !== experience && (next === "business" || next === "customer")) {
            router.push(next === "business" ? "/empresa" : "/cliente");
          }
        }}
      >
        <option value="business">Mi negocio</option>
        <option value="customer">Modo cliente</option>
      </select>
    </label>
  );
}
