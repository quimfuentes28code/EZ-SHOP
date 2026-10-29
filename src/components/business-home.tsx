"use client";

import { ArrowRight, CalendarDays, ClipboardList, FileText, Image, LayoutDashboard, MapPin, MessageCircle, Settings2, ShieldCheck, ShoppingBag, UsersRound, WalletCards, type LucideIcon } from "lucide-react";
import { MODULES, type ModuleId } from "@/lib/catalog";
import { useEffect,useState } from "react";
import { getSupabase } from "@/lib/supabase/client";

export type BusinessArea = "inicio" | "negocio" | "gestion" | "clientes" | "solicitudes-empresa" | "mensajes" | "sedes" | "workboard" | "herramientas" | "perfil";

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
    {label:"Mensajes",desc:"Conversa con clientes de tu negocio",area:"mensajes",icon:MessageCircle},
    {label:"Mis tiendas",desc:"Sedes y ubicaciones de tu empresa",area:"sedes",icon:MapPin},
    {label:"Proyectos y agenda",desc:"Organiza trabajos y citas internas",area:"workboard",icon:CalendarDays},
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

      </div>
      <p className="business-live-disclaimer"><ShieldCheck size={15}/> La cuenta, los servicios y el CRM son reales. No se emiten todavía facturas, pagos ni reservas automáticas.</p>
    </div>
  );
}

const working: Partial<Record<ModuleId,BusinessArea>>={
  customers:"clientes",
  services:"gestion",
  communications:"mensajes",
  locations:"sedes",
  projects:"workboard",
  bookings:"workboard",
  quotes:"workboard",
  workOrders:"workboard",
  orders:"workboard",
};
const icons: Partial<Record<ModuleId,LucideIcon>>={
  customers:UsersRound,services:ShoppingBag,bookings:CalendarDays,quotes:FileText,
  projects:ClipboardList,galleries:Image,communications:MessageCircle,
  payments:WalletCards,invoices:FileText,
};

export function BusinessTools({onNavigate,organizationId}:{onNavigate:(area:BusinessArea)=>void;organizationId:string}) {
  const db=getSupabase();
  const [enabled,setEnabled]=useState<string[]>([]);
  const [saved,setSaved]=useState(false);
  const [saving,setSaving]=useState(false);
  const [notice,setNotice]=useState("");
  useEffect(()=>{
    if(!db||!organizationId)return;
    db.from("organization_module_settings").select("modules").eq("organization_id",organizationId).maybeSingle()
      .then(({data,error})=>{
        if(error)setNotice("No se pudieron cargar preferencias: "+error.message);
        else if(data){setEnabled((data.modules||[]) as string[]);setSaved(true);}
      });
  },[db,organizationId]);
  const saveModules=async()=>{
    if(!db||!organizationId)return;
    setSaving(true);setNotice("");
    try{
      const {error}=await db.from("organization_module_settings").upsert({organization_id:organizationId,modules:enabled},{onConflict:"organization_id"});
      if(error)throw error;
      setSaved(true);setNotice("Herramientas seleccionadas guardadas en tu cuenta.");
    }catch(e){setNotice(e instanceof Error?e.message:"No se pudo guardar la configuración.");}
    finally{setSaving(false);}
  };

  return <section className="live-card">
    <div className="business-live-section-head"><div><h2>Todas las herramientas</h2><p className="live-muted">AutonoService se adapta al tipo de negocio. Aquí tienes el catálogo, indicando cuáles están conectadas de verdad.</p></div></div>
    <p className="live-muted">Personaliza los módulos destacados en tu empresa. Las herramientas disponibles se pueden utilizar aunque no las marques; lo que configuras es su visibilidad y prioridad.</p>
    <div className="business-live-module-editor">
      <strong>Módulos destacados</strong>
      <div className="business-live-module-checkboxes">
        {(Object.entries(MODULES) as [ModuleId,(typeof MODULES)[ModuleId]][]).filter(([id])=>!!working[id]).map(([id,m])=>
          <label key={id}><input type="checkbox" checked={enabled.includes(id)} onChange={e=>setEnabled(current=>e.target.checked?[...current,id]:current.filter(x=>x!==id))}/>{m.label}</label>)}
      </div>
      <button type="button" className="button secondary" onClick={saveModules} disabled={saving||!organizationId}>Guardar selección</button>
      {saved&&<span className="live-muted">Configuración personalizada</span>}
      {notice&&<p className="live-alert" role="status">{notice}</p>}
    </div>
    <div className="business-live-section-head"><h3>Herramientas disponibles</h3><span>Puedes usarlas ya con tu empresa</span></div>
    <div className="business-live-tool-grid">
      {(Object.entries(MODULES) as [ModuleId,(typeof MODULES)[ModuleId]][])
        .filter(([id])=>!!working[id]&&(!saved||enabled.includes(id))).map(([id,m])=>{
          const Icon=icons[id]||Settings2;
          return <button type="button" className="business-live-tool" key={id} onClick={()=>onNavigate(working[id]!)}>
            <Icon size={19}/><strong>{m.label}</strong><small>{m.desc}</small><em className="business-live-available">Disponible</em>
          </button>;
        })}
      <button type="button" className="business-live-tool" onClick={()=>onNavigate("solicitudes-empresa")}>
        <ClipboardList size={19}/><strong>Solicitudes</strong><small>Gestiona solicitudes reales de tus clientes</small><em className="business-live-available">Disponible</em>
      </button>
      <button type="button" className="business-live-tool" onClick={()=>onNavigate("negocio")}>
        <Settings2 size={19}/><strong>Perfil comercial y publicaciones</strong><small>Portada, fotos, vídeos y novedades sociales</small><em className="business-live-available">Disponible</em>
      </button>
    </div>
    {saved&&<details className="business-live-tools-details"><summary>Mostrar otras herramientas disponibles</summary>
       <div className="business-live-tool-grid">
        {(Object.entries(MODULES) as [ModuleId,(typeof MODULES)[ModuleId]][])
         .filter(([id])=>!!working[id]&&!enabled.includes(id)).map(([id,m])=>{
           const Icon=icons[id]||Settings2;
           return <button type="button" className="business-live-tool" key={id} onClick={()=>onNavigate(working[id]!)}>
             <Icon size={19}/><strong>{m.label}</strong><small>{m.desc}</small><em className="business-live-available">Disponible</em>
           </button>;
         })}
       </div>
    </details>}
    <details className="business-live-tools-details"><summary>Próximas herramientas (aún sin backend)</summary>
      <p className="live-muted">No mostramos estas funciones como activas hasta que puedan guardar y consultar datos reales.</p>
      <div className="business-live-tool-grid">
       {(Object.entries(MODULES) as [ModuleId,(typeof MODULES)[ModuleId]][])
        .filter(([id])=>!working[id]).map(([id,m])=>{
           const Icon=icons[id]||Settings2;
           return <div className="business-live-tool is-upcoming" key={id}>
             <Icon size={19}/><strong>{m.label}</strong><small>{m.desc}</small><em>En desarrollo</em>
           </div>;
         })}
      </div>
    </details>
    <p className="live-muted">Las herramientas marcadas «En desarrollo» todavía no ejecutan operaciones reales. La mensajería incluye adjuntos privados; las reservas automáticas y la facturación siguen pendientes.</p>
  </section>;
}
