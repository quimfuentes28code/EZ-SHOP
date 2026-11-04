"use client";

import { ArrowRight, CalendarDays, ClipboardList, FileText, Image, LayoutDashboard, MapPin, MessageCircle, Settings2, ShieldCheck, ShoppingBag, UsersRound, WalletCards, type LucideIcon } from "lucide-react";
import { MODULES, type ModuleId } from "@/lib/catalog";
import { useEffect,useRef,useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { BUSINESS_MANAGEMENT_ITEMS } from "@/lib/app-navigation";

export type BusinessArea = "gestion-hub" | "agenda" | "inicio" | "negocio" | "diseno" | "gestion" | "clientes" | "solicitudes-empresa" | "mensajes" | "sedes" | "workboard" | "herramientas" | "perfil";

type Company = { id?: string; name: string; category: string; city: string; description: string; published: boolean };
type BusinessHomeProps = {
  organization: Company | null;
  serviceCount: number;
  customerCount: number;
  requestCount: number;
  pendingCount: number;
  recentRequests?: readonly {id:string;customer_name:string;notes:string;status:string;created_at:string}[];
  onNavigate: (area: BusinessArea) => void;
};

type Shortcut = {
  label: string;
  desc: string;
  area: BusinessArea;
  icon: LucideIcon;
  value?: string;
};

export function BusinessHome({organization,serviceCount,customerCount,requestCount,pendingCount,recentRequests=[],onNavigate}:BusinessHomeProps) {
  const db=getSupabase();
  const [upcoming,setUpcoming]=useState<{id:string;title:string;scheduled_date:string;kind:string}[]>([]);
  const [upcomingError,setUpcomingError]=useState(false);
  const [upcomingReload,setUpcomingReload]=useState(0);
  useEffect(()=>{
    setUpcoming([]);setUpcomingError(false);
    if(!db||!organization?.id)return;
    let active=true;
    const date=new Date().toLocaleDateString("sv-SE");
    db.from("business_work_items").select("id,title,scheduled_date,kind").eq("organization_id",organization.id)
      .in("status",["pending","in_progress"]).gte("scheduled_date",date).order("scheduled_date",{ascending:true}).limit(5)
      .then(({data,error})=>{if(active){setUpcomingError(Boolean(error));if(!error)setUpcoming(data||[]);}});
    return()=>{active=false;};
  },[db,organization?.id,upcomingReload]);
  const shortcuts:Shortcut[]=[
    {label:"Solicitudes",desc:"Revisar y actualizar solicitudes recibidas",area:"solicitudes-empresa",icon:ClipboardList,value:String(pendingCount)+" pendientes"},
    {label:"Servicios",desc:"Catálogo y precios de tu empresa",area:"gestion",icon:ShoppingBag,value:String(serviceCount)},
    {label:"Mensajes",desc:"Conversaciones con tus clientes",area:"mensajes",icon:MessageCircle},
    {label:"Perfil del negocio",desc:"Datos comerciales, diseño y publicaciones",area:"negocio",icon:Settings2,value:organization?.published?"Publicado":"Privado"},
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
        <h3>Accesos rápidos</h3><button className="button secondary small" type="button" onClick={()=>onNavigate("gestion-hub")}>Abrir Gestión <ArrowRight size={15}/></button>
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
      {recentRequests.length>0&&<section className="live-card business-recent-activity"><div className="business-live-section-head"><h3>Actividad reciente</h3><button className="button secondary small" type="button" onClick={()=>onNavigate("solicitudes-empresa")}>Ver solicitudes</button></div>{recentRequests.slice(0,3).map(request=><article className="live-row" key={request.id}><div><strong>{request.customer_name||"Cliente"}</strong><p>{request.notes||"Solicitud recibida"}</p></div><span className="live-status">{({new:"Nueva",accepted:"Aceptada",rejected:"Rechazada",completed:"Completada"} as Record<string,string>)[request.status]||request.status}</span></article>)}</section>}
      {(upcoming.length>0||upcomingError)&&<section className="live-card business-upcoming"><div className="business-live-section-head"><h3>Próximos trabajos y citas internas</h3><button className="button secondary small" type="button" onClick={()=>onNavigate("agenda")}>Abrir Agenda</button></div>{upcomingError?<p className="live-muted">No se pudo consultar la planificación. <button className="button secondary small" type="button" onClick={()=>setUpcomingReload(value=>value+1)}>Reintentar planificación</button></p>:upcoming.map(item=><article className="live-row" key={item.id}><strong>{item.title}</strong><time dateTime={item.scheduled_date}>{item.scheduled_date}</time></article>)}</section>}
      <p className="business-live-disclaimer"><ShieldCheck size={15}/> La cuenta, los servicios y el CRM son reales. No se emiten todavía facturas, pagos ni reservas automáticas.</p>
    </div>
  );
}

export function BusinessManagement({onNavigate,hasOrganization}:{onNavigate:(area:BusinessArea)=>void;hasOrganization:boolean}){
 return <section className="business-management" aria-label="Gestión de tu negocio"><div className="business-live-section-head"><div><h2>Gestión de tu negocio</h2><p className="live-muted">Clientes, servicios, solicitudes y herramientas de la empresa activa.</p></div></div>{!hasOrganization&&<div className="business-live-next"><h3>Registra tu empresa</h3><p>Completa los datos comerciales para empezar a utilizar sus herramientas.</p><button type="button" className="button primary" onClick={()=>onNavigate("gestion")}>Crear empresa</button></div>}<div className="business-live-shortcuts">{BUSINESS_MANAGEMENT_ITEMS.map(item=><button type="button" className="business-live-shortcut" key={item.id} onClick={()=>onNavigate(item.id as BusinessArea)}><span className="business-live-shortcut-copy"><strong>{item.label}</strong><small>{item.description}</small></span><ArrowRight size={17}/></button>)}</div></section>;
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
  const [savedModules,setSavedModules]=useState<string[]|null>(null);
  const [loading,setLoading]=useState(true);
  const [loadFailed,setLoadFailed]=useState(false);
  const [reload,setReload]=useState(0);
  const [saving,setSaving]=useState(false);
  const [notice,setNotice]=useState("");
  const generation=useRef(0);
  useEffect(()=>{
    const current=++generation.current;
    let active=true;
    setEnabled([]);setSavedModules(null);setSaving(false);setLoadFailed(false);setNotice("");
    setLoading(!!db&&!!organizationId);
    if(!db||!organizationId)return;
    db.from("organization_module_settings").select("modules").eq("organization_id",organizationId).maybeSingle()
      .then(({data,error})=>{
        if(!active||current!==generation.current)return;
        setLoading(false);
        if(error){setLoadFailed(true);setNotice("No se pudieron cargar preferencias: "+error.message);}
        else if(data){
          const modules=Array.isArray(data.modules)
            ? data.modules.filter((id:unknown):id is string=>typeof id==="string"&&Object.hasOwn(working,id))
            : [];
          setEnabled(modules);setSavedModules(modules);
        }
      });
    return ()=>{active=false;generation.current++;};
  },[db,organizationId,reload]);
  const saveModules=async()=>{
    if(!db||!organizationId||loading||loadFailed||saving)return;
    const current=generation.current;
    const snapshot=[...enabled];
    setSaving(true);setNotice("");
    try{
      const {error}=await db.from("organization_module_settings").upsert({organization_id:organizationId,modules:snapshot},{onConflict:"organization_id"});
      if(error)throw error;
      if(current!==generation.current)return;
      setSavedModules(snapshot);setNotice("Herramientas seleccionadas guardadas en tu cuenta.");
    }catch(e){if(current===generation.current)setNotice(e instanceof Error?e.message:"No se pudo guardar la configuración.");}
    finally{if(current===generation.current)setSaving(false);}
  };
  const dirty=savedModules===null
    ? enabled.length>0
    : enabled.length!==savedModules.length||enabled.some(id=>!savedModules.includes(id));

  return <section className="live-card">
    <div className="business-live-section-head"><div><h2>Todas las herramientas</h2><p className="live-muted">AutonoService se adapta al tipo de negocio. Aquí tienes el catálogo, indicando cuáles están conectadas de verdad.</p></div></div>
    <p className="live-muted">Personaliza los módulos destacados en tu empresa. Las herramientas disponibles se pueden utilizar aunque no las marques; lo que configuras es su visibilidad y prioridad.</p>
    <div className="business-live-module-editor">
      <strong>Módulos destacados</strong>
      <div className="business-live-module-checkboxes">
        {(Object.entries(MODULES) as [ModuleId,(typeof MODULES)[ModuleId]][]).filter(([id])=>!!working[id]).map(([id,m])=>
          <label key={id}><input type="checkbox" checked={enabled.includes(id)} disabled={loading||loadFailed||saving||!organizationId} onChange={e=>setEnabled(current=>e.target.checked?[...current,id]:current.filter(x=>x!==id))}/>{m.label}</label>)}
      </div>
      <button type="button" className="button secondary" onClick={saveModules} disabled={loading||loadFailed||saving||!organizationId}>{saving?"Guardando...":"Guardar selección"}</button>
      {loadFailed&&<button type="button" className="button secondary" onClick={()=>setReload(value=>value+1)}>Reintentar carga</button>}
      {loading&&<span role="status" className="live-muted">Cargando herramientas de esta empresa...</span>}
      {!loading&&dirty&&<span role="status" className="live-muted">Tienes cambios sin guardar.</span>}
      {!dirty&&savedModules!==null&&<span className="live-muted">Configuración personalizada guardada</span>}
      {notice&&<p className="live-alert" role="status">{notice}</p>}
    </div>
    <div className="business-live-section-head"><h3>Herramientas disponibles</h3><span>Puedes usarlas ya con tu empresa</span></div>
    <div className="business-live-tool-grid">
      {(Object.entries(MODULES) as [ModuleId,(typeof MODULES)[ModuleId]][])
        .filter(([id])=>!!working[id]&&(savedModules===null||savedModules.includes(id))).map(([id,m])=>{
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
    {savedModules!==null&&<details className="business-live-tools-details"><summary>Mostrar otras herramientas disponibles</summary>
       <div className="business-live-tool-grid">
        {(Object.entries(MODULES) as [ModuleId,(typeof MODULES)[ModuleId]][])
         .filter(([id])=>!!working[id]&&!savedModules.includes(id)).map(([id,m])=>{
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
