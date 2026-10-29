"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "dark" | "light";
const THEME_KEY = "autonoservice-theme-v1";
const THEME_EVENT = "autonoservice-theme-change";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [status, setStatus] = useState("");

  useEffect(() => {
    let initial: Theme = "dark";
    try {
      if (localStorage.getItem(THEME_KEY) === "light") initial = "light";
    } catch {
      // Theme switching remains usable when storage is unavailable.
    }
    document.documentElement.dataset.theme = initial;
    setTheme(initial);
    const synchronize = () =>
      setTheme(
        document.documentElement.dataset.theme === "light" ? "light" : "dark",
      );
    const synchronizeStorage = (event: StorageEvent) => {
      if (event.key !== THEME_KEY) return;
      document.documentElement.dataset.theme =
        event.newValue === "light" ? "light" : "dark";
      synchronize();
    };
    window.addEventListener(THEME_EVENT, synchronize);
    window.addEventListener("storage", synchronizeStorage);
    return () => {
      window.removeEventListener(THEME_EVENT, synchronize);
      window.removeEventListener("storage", synchronizeStorage);
    };
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    setTheme(next);
    window.dispatchEvent(new Event(THEME_EVENT));
    try {
      localStorage.setItem(THEME_KEY, next);
      setStatus(`Modo ${next === "light" ? "claro" : "oscuro"} guardado.`);
    } catch {
      setStatus(
        "El tema cambia durante esta visita; este navegador no permite guardarlo.",
      );
    }
  };
  const label = `Cambiar a modo ${theme === "dark" ? "claro" : "oscuro"}`;
  return (
    <>
      <button
        type="button"
        className="icon-button theme-toggle"
        onClick={toggle}
        aria-label={label}
        title={label}
      >
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </button>
      <span className="sr-only" role="status">
        {status}
      </span>
    </>
  );
}
