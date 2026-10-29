"use client";

import { ArrowRight, CalendarDays, ClipboardList, FileText, Image, LayoutDashboard, MapPin, MessageCircle, Settings2, ShieldCheck, ShoppingBag, UsersRound, WalletCards, type LucideIcon } from "lucide-react";
import { MODULES, type ModuleId } from "@/lib/catalog";

export type BusinessArea = "inicio" | "negocio" | "gestion" | "clientes" | "solicitudes-empresa" | "herramientas" | "perfil";

type Company = { name: string; category: string; city: string; description: string; published: boolean };
type BusinessHomeProps = {
  organization: Company | null;
  serviceCount: number;
  customerCount: number;
  requestCount: number;
  pendingCount: number;
  onNavigate: (area: BusinessArea) => void;
};

type Shortcut = {
  label: string;
  desc: string;
  area: BusinessArea;
  icon: LucideIcon;
  value?: string;
};

export function BusinessHome({organization,serviceCount,customerCount,requestCount,pendingCount,onNavigate}:BusinessHomeProps) {
  const shortcuts:Shortcut[]=[
    {label:"Perfil del negocio",desc:"Datos comerciales y visibilidad en Explorar",area:"negocio",icon:Settings2,value:organization?.published?"Publicado":"Privado"},
    {label:"Servicios",desc:"Catálogo de servicios y precios reales",area:"gestion",icon:ShoppingBag,value:String(serviceCount)},
    {label:"Clientes",desc:"Fichas CRM vinculadas a solicitudes",area:"clientes",icon:UsersRound,value:String(customerCount)},
    {label:"Solicitudes",desc:"Revisar y actualizar estados",area:"solicitudes-empresa",icon:ClipboardList,value:String(requestCount)},
    {label:"Herramientas",desc:"Todos los módulos y su estado de desarrollo",area:"herramientas",icon:LayoutDashboard},
  ];
  return (
    <div className="business-live-home">
      <div className="business-live-welcome">
        <span className="eyebrow">PANEL DE CONTROL</span>
        <h2>{organization?organization.name:"Configura tu primer negocio"}</h2>
        <p>{organization
          ? `Este es el espacio de gestión de ${organization.name}. Los datos de servicios, solicitudes y clientes provienen de tu cuenta real.`
          : "Tu cuenta Empresa ya está creada. Registra un negocio para activar su perfil, servicios y CRM."}</p>
        {organization && <div className="business-live-status"><MapPin size={15}/>{organization.city||"Sin localidad"} <span>·</span> {organization.category||"Sector sin indicar"} <span>·</span> {organization.published?"Visible en Explorar":"Todavía privado"}</div>}
      </div>

      <div className="business-live-metrics" aria-label="Resumen real del negocio">
        <div><span>Servicios</span><strong>{serviceCount}</strong><small>En tu catálogo</small></div>
        <div><span>Clientes</span><strong>{customerCount}</strong><small>Contactos autorizados</small></div>
        <div><span>Solicitudes</span><strong>{requestCount}</strong><small>Recibidas</small></div>
        <div><span>Pendientes</span><strong>{pendingCount}</strong><small>Por revisar</small></div>
      </div>
      {!organization && <section className="business-live-next">
        <h3>Primer paso: crea tu negocio</h3>
        <p>Completa el nombre comercial, sector y localidad para empezar. Después podrás personalizar la ficha pública y añadir servicios.</p>
        <button type="button" className="button primary" onClick={()=>onNavigate("gestion")}>Configurar negocio <ArrowRight size={16}/></button>
      </section>}
      {organization && (!organization.description.trim() || serviceCount===0) && <section className="business-live-next">
        <strong>Completa tu puesta en marcha</strong>
        <p>{!organization.description.trim()?"Añade una descripción a tu perfil comercial para que los clientes entiendan qué ofreces.":"Ya tienes un perfil comercial. Añade un servicio para recibir solicitudes."}</p>
        <button type="button" className="button primary" onClick={()=>onNavigate(!organization.description.trim()?"negocio":"gestion")}>{!organization.description.trim()?"Editar perfil del negocio":"Añadir servicio"} <ArrowRight size={16}/></button>
      </section>}
      <div className="business-live-section-head">
        <h3>Tus herramientas</h3><span>Funcionalidades actuales y próximas</span>
      </div>
      <div className="business-live-shortcuts">
        {shortcuts.map(({label,desc,area,icon:Icon,value})=>
          <button key={label} type="button" className="business-live-shortcut" onClick={()=>onNavigate(area)}>
            <span className="business-live-shortcut-icon"><Icon size={20}/></span>
            <span className="business-live-shortcut-copy"><strong>{label}</strong><small>{desc}</small></span>
            {value && <span className="business-live-value">{value}</span>}
            <ArrowRight size={16} aria-hidden="true"/>
          </button>)}
      </div>
      <div className="business-live-section-head"><h3>En desarrollo</h3><span>Se activarán por fases</span></div>
      <div className="business-live-preview-list">
        <span><CalendarDays size={17}/> Citas y reservas</span>
        <span><FileText size={17}/> Presupuestos y facturación</span>
        <span><WalletCards size={17}/> Cobros</span>
        <span><Image size={17}/> Galerías de entrega</span>
        <span><MessageCircle size={17}/> Mensajería</span>
      </div>
      <p className="business-live-disclaimer"><ShieldCheck size={15}/> La cuenta, los servicios y el CRM son reales. No se emiten todavía facturas, pagos ni reservas automáticas.</p>
    </div>
  );
}

const working: Partial<Record<ModuleId,BusinessArea>>={
  customers:"clientes",
  services:"gestion",
};
const icons: Partial<Record<ModuleId,LucideIcon>>={
  customers:UsersRound,services:ShoppingBag,bookings:CalendarDays,quotes:FileText,
  projects:ClipboardList,galleries:Image,communications:MessageCircle,
  payments:WalletCards,invoices:FileText,
};

export function BusinessTools({onNavigate}:{onNavigate:(area:BusinessArea)=>void}) {
  return <section className="live-card">
    <div className="business-live-section-head"><div><h2>Todas las herramientas</h2><p className="live-muted">AutonoService se adapta al tipo de negocio. Aquí tienes el catálogo, indicando cuáles están conectadas de verdad.</p></div></div>
    <div className="business-live-tool-grid">
      {(Object.entries(MODULES) as [ModuleId,(typeof MODULES)[ModuleId]][]).map(([id,m])=>{
        const area=working[id];
        const Icon=icons[id]||Settings2;
        return area?
        <button type="button" className="business-live-tool" key={id} onClick={()=>onNavigate(area)}>
          <Icon size={19}/><strong>{m.label}</strong><small>{m.desc}</small><em className="business-live-available">Disponible</em>
        </button>:
        <div className="business-live-tool is-upcoming" key={id}>
          <Icon size={19}/><strong>{m.label}</strong><small>{m.desc}</small><em>En desarrollo</em>
        </div>;
      })}
      <button type="button" className="business-live-tool" onClick={()=>onNavigate("solicitudes-empresa")}>
        <ClipboardList size={19}/><strong>Solicitudes</strong><small>Gestiona solicitudes de servicios de tus clientes</small><em className="business-live-available">Disponible</em>
      </button>
      <button type="button" className="business-live-tool" onClick={()=>onNavigate("negocio")}>
        <Settings2 size={19}/><strong>Perfil comercial</strong><small>Edita tu negocio y su visibilidad pública</small><em className="business-live-available">Disponible</em>
      </button>
    </div>
    <p className="live-muted">Las herramientas marcadas «En desarrollo» aún no guardan información ni ejecutan operaciones reales.</p>
  </section>;
}
