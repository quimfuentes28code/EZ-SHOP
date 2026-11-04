"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  Blocks, CalendarDays, ClipboardList, Compass, Heart, House, LayoutDashboard,
  LogOut, MapPinned, MessageCircle, RefreshCw, Settings2, ShoppingBag, Store,
  UserRound, UsersRound, type LucideIcon,
} from "lucide-react";
import { AccountExperienceSwitcher } from "@/components/account-experience-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { BUSINESS_DESKTOP_GROUPS, navigationFor, type AppExperience, type NavigationIcon } from "@/lib/app-navigation";
import "./app-navigation.css";

export { CLIENT_NAVIGATION, BUSINESS_NAVIGATION } from "@/lib/app-navigation";

const icons: Record<NavigationIcon, LucideIcon> = {
  compass: Compass, map: MapPinned, heart: Heart, messages: MessageCircle,
  profile: UserRound, home: House, calendar: CalendarDays, management: LayoutDashboard,
  customers: UsersRound, requests: ClipboardList, services: ShoppingBag,
  locations: MapPinned, tools: Blocks, store: Store,
};

type SectionNavigationProps = {
  experience: AppExperience;
  active: string;
  onNavigate: (id: string) => void;
};

function NavigationButtons({ experience, active, onNavigate }: SectionNavigationProps) {
  return navigationFor(experience).map(({ id, label, icon }) => {
    const Icon = icons[icon];
    return <button key={id} type="button" className={active === id ? "is-active" : ""}
      aria-current={active === id ? "page" : undefined} onClick={() => onNavigate(id)}>
      <Icon size={21} aria-hidden="true"/><span>{label}</span>
    </button>;
  });
}

/** The native keyboard occupies the bottom edge; give the editor that space. */
function useKeyboardVisible() {
  const [visible, setVisible] = useState(false);
  const restingHeight = useRef(0);
  const restingWidth = useRef(0);
  useEffect(() => {
    const viewport = window.visualViewport;
    let frame = 0;
    const update = () => {
      const target = document.activeElement;
      const editing = target instanceof HTMLElement && (
        target.matches("input:not([type='checkbox']):not([type='radio']):not([type='button']):not([type='submit']),textarea,select,[contenteditable='true']")
      );
      const height = viewport?.height ?? window.innerHeight;
      // Rotation/resizing the window is not the keyboard opening. Its width
      // changes too, unlike the usual keyboard-only viewport height change.
      if (restingWidth.current !== window.innerWidth) {
        restingWidth.current = window.innerWidth;
        restingHeight.current = window.innerHeight;
      }
      if (!editing) restingHeight.current = height;
      if (!restingHeight.current) restingHeight.current = window.innerHeight;
      setVisible(editing && (window.innerHeight - height > 120 || restingHeight.current - height > 120));
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    restingHeight.current = viewport?.height ?? window.innerHeight;
    restingWidth.current = window.innerWidth;
    window.addEventListener("resize", schedule);
    window.addEventListener("orientationchange", schedule);
    viewport?.addEventListener("resize", schedule);
    viewport?.addEventListener("scroll", schedule);
    document.addEventListener("focusin", schedule);
    document.addEventListener("focusout", schedule);
    update();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("orientationchange", schedule);
      viewport?.removeEventListener("resize", schedule);
      viewport?.removeEventListener("scroll", schedule);
      document.removeEventListener("focusin", schedule);
      document.removeEventListener("focusout", schedule);
    };
  }, []);
  return visible;
}

export function AppBottomNavigation({ hidden = false, ...props }: SectionNavigationProps & { hidden?: boolean }) {
  const keyboardVisible = useKeyboardVisible();
  return <nav className="app-bottom-navigation" aria-label={props.experience === "customer" ? "Navegación Cliente" : "Navegación Empresa"}
    hidden={hidden || keyboardVisible} data-keyboard-hidden={keyboardVisible ? "true" : undefined}>
    <NavigationButtons {...props}/>
  </nav>;
}

export function AppSectionNavigation(props: SectionNavigationProps) {
  return <nav className="app-section-navigation" aria-label={props.experience === "customer" ? "Navegación Cliente" : "Navegación Empresa"}>
    <NavigationButtons {...props}/>
  </nav>;
}

export function DesktopBusinessNavigation({ active, onNavigate }: { active: string; onNavigate: (area: string) => void }) {
  const headingPrefix = useId();
  const current = active === "agenda" ? "workboard" : active === "diseno" ? "negocio" : active;
  return <nav className="app-business-navigation" aria-label="Módulos disponibles">
    {BUSINESS_DESKTOP_GROUPS.map((group, index) => <section key={group.label} className="app-navigation-group" aria-labelledby={headingPrefix + index}>
      <h2 id={headingPrefix + index}>{group.label}</h2>
      {group.items.map(({ id, label, icon }) => {
        const Icon = icons[icon];
        return <button key={id} type="button" className={`workspace-nav-item ${current === id ? "is-active" : ""}`}
          aria-current={current === id ? "page" : undefined} onClick={() => onNavigate(id)}>
          <Icon size={18} aria-hidden="true"/><span>{label}</span>
        </button>;
      })}
    </section>)}
  </nav>;
}

export function AccountActions({ experience, onLogout, onRefresh, onAccount }: {
  experience: AppExperience; onLogout: () => void; onRefresh?: () => void; onAccount: () => void;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const closeOutside = (event: PointerEvent | FocusEvent) => {
      if (ref.current?.open && event.target instanceof Node && !ref.current.contains(event.target)) ref.current.open = false;
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && ref.current?.open) {
        event.preventDefault();
        ref.current.open = false;
        ref.current.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("focusin", closeOutside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("focusin", closeOutside);
      document.removeEventListener("keydown", escape);
    };
  }, []);
  const act = (action: () => void) => { if (ref.current) ref.current.open = false; action(); };
  return <details ref={ref} className="app-account-actions">
    <summary aria-label="Opciones de cuenta"><UserRound size={20} aria-hidden="true"/><span>Cuenta</span></summary>
    <div className="app-account-panel" role="group" aria-label="Opciones de cuenta">
      <button type="button" onClick={() => act(onAccount)}><Settings2 size={17} aria-hidden="true"/>Mi cuenta y configuración</button>
      <div className="app-account-experience"><span>Experiencia</span><AccountExperienceSwitcher experience={experience}/></div>
      <div className="app-account-theme"><span>Apariencia</span><ThemeToggle/></div>
      {onRefresh && <button type="button" onClick={() => act(onRefresh)}><RefreshCw size={17} aria-hidden="true"/>Actualizar datos</button>}
      <button type="button" onClick={() => act(onLogout)}><LogOut size={17} aria-hidden="true"/>Cerrar sesión</button>
    </div>
  </details>;
}
