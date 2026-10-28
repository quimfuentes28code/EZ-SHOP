"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Bell, CalendarDays, Check, ChevronRight, CircleDollarSign, Clock3, FileText, FolderKanban, Settings2, ShieldAlert, UsersRound } from "lucide-react";
import { MODULES, sectorById, type ModuleId } from "@/lib/catalog";
import { DEFAULT_CONFIG, loadDemoConfig, type DemoConfig } from "@/lib/demo";

const exampleItems: Record<string, string[]> = {
  customers: ["Laura Martínez", "NOVA Clothing", "Restaurante Mar"],
  bookings: ["03 nov. · Sesión de retrato · 10:00", "05 nov. · Grabación corporativa · 09:30", "09 nov. · Sesión de producto · 16:00"],
  quotes: ["Presupuesto #024 · 750 € · Pendiente", "Presupuesto #023 · 1.200 € · Aceptado"],
  projects: ["Campaña NOVA · En edición", "Vídeo corporativo · En planificación", "Catálogo de producto · En revisión"],
  galleries: ["Campaña NOVA · 24 fotos · 3 comentarios", "Retratos corporativos · Entrega aprobada"],
  orders: ["Encargo personalizado · En preparación", "Pedido para recoger · Confirmado"],
  capacity: ["Reserva de 4 plazas · 18:00", "Reserva de 2 plazas · 20:00"],
  workOrders: ["Orden #102 · En curso", "Orden #103 · Pendiente de piezas"],
  stock: ["Producto A · 14 unidades", "Producto B · 4 unidades"],
  staff: ["Equipo / empleado principal", "Empleado de ejemplo"],
};
export default function BusinessPage() {
  const [config,setConfig]=useState<DemoConfig>(DEFAULT_CONFIG);
  const [selected,setSelected]=useState<ModuleId|"summary">("summary");
  useEffect(()=>{setConfig(loadDemoConfig());},[]);
  const active = config.modules;
  const sector = sectorById(config.sectorId);
  const currentlySelected = selected!=="summary"&&!active.includes(selected)?"summary":selected;
  return <div className="container workspace">
    <aside className="workspace-sidebar">
      <div className="sidebar-title"><span className="avatar-business">{(config.name||"N").slice(0,1).toLocaleUpperCase("es")}</span><div><strong>{config.name||"Mi negocio"}</strong><small>{sector.label}</small></div></div>
      <p className="nav-label">ESPACIO DE TRABAJO</p>
      <button type="button" className={`sidebar-link ${currentlySelected==="summary"?"active":""}`} onClick={()=>setSelected("summary")}><FolderKanban size={18}/> Resumen</button>
      {active.map(id=><button type="button" key={id} className={`sidebar-link ${currentlySelected===id?"active":""}`} onClick={()=>setSelected(id)}><span className="nav-dot"/>{MODULES[id].label}</button>)}
      <div className="sidebar-bottom"><Link href="/onboarding" className="sidebar-link"><Settings2 size={17}/> Cambiar módulos</Link><Link href="/cliente" className="sidebar-link"><UsersRound size={17}/> Vista cliente</Link></div>
    </aside>
    <div className="workspace-main">
      <div className="workspace-heading"><div><div className="eyebrow">{sector.label} / PANEL DE EMPRESA</div><h1>{currentlySelected==="summary"?"Resumen general":MODULES[currentlySelected].label}</h1><p className="muted">{currentlySelected==="summary"?"Tu actividad organizada en un solo lugar.":MODULES[currentlySelected].desc}</p></div><div className="top-icons"><Bell size={20}/><span className="round-circle">{(config.name||"N").slice(0,1)}</span></div></div>
      {currentlySelected==="summary"?<>
        <div className="metric-grid"><Metric label="Reservas próximas" value={active.includes("bookings")||active.includes("capacity")?"06":"—"} icon={<CalendarDays size={22}/>}/><Metric label="Trabajos activos" value={active.includes("projects")||active.includes("workOrders")?"04":"—"} icon={<FolderKanban size={22}/>}/><Metric label="Presupuestos por responder" value={active.includes("quotes")?"03":"—"} icon={<FileText size={22}/>}/><Metric label="Clientes" value="18" icon={<UsersRound size={22}/>}/></div>
        <div className="dashboard-columns"><section className="content-card"><div className="card-title-row"><h2>Próximas actividades</h2><Clock3 size={19}/></div><div className="activity-row"><span className="activity-date"><strong>03</strong><small>NOV</small></span><div><strong>{config.sectorId==="photo"?"Sesión de retrato":"Servicio / reserva de ejemplo"}</strong><p>Laura Martínez · 10:00</p></div><span className="status">Confirmada</span></div><div className="activity-row"><span className="activity-date"><strong>05</strong><small>NOV</small></span><div><strong>{config.sectorId==="photo"?"Grabación de vídeo":"Nuevo encargo"}</strong><p>Empresa NOVA · 09:30</p></div><span className="status warning">Pendiente</span></div></section>
        <section className="content-card"><div className="card-title-row"><h2>Necesitan tu atención</h2><ShieldAlert size={19}/></div><div className="attention"><CircleDollarSign size={20}/><div><strong>Revisar solicitud</strong><p>Un presupuesto o encargo necesita respuesta.</p></div><ChevronRight size={18}/></div><div className="attention"><Check size={20}/><div><strong>Completar configuración</strong><p>Conecta tu negocio a servicios reales en hitos posteriores.</p></div><ChevronRight size={18}/></div></section></div>
        <div className="notice"><ShieldAlert size={20}/><p>Estás viendo datos ficticios. En este hito, las pantallas muestran la estructura del producto; todavía no hay autenticación, persistencia en servidor ni reservas enviadas.</p></div>
      </>:<section className="content-card wide"><div className="card-title-row"><h2>{MODULES[currentlySelected].label}</h2><span className="tag">Módulo activo</span></div><p className="muted">{MODULES[currentlySelected].desc}. Los registros siguientes son ejemplos para validar la estructura visual.</p><div className="record-list">{(exampleItems[currentlySelected]||[`${MODULES[currentlySelected].label} · Ejemplo 1`,`${MODULES[currentlySelected].label} · Ejemplo 2`]).map((item,i)=><div className="record-row" key={item}><span className="record-num">{String(i+1).padStart(2,"0")}</span><strong>{item}</strong><ChevronRight size={17}/></div>)}</div><div className="module-footer"><span>Esta pantalla se conectará al backend en próximos hitos.</span><Link href="/onboarding" className="inline-link">Ajustar herramientas <ArrowRight size={16}/></Link></div></section>}
    </div>
  </div>;
}
function Metric({label,value,icon}:{label:string,value:string,icon:React.ReactNode}) {return <div className="metric"><span className="metric-icon">{icon}</span><strong>{value}</strong><small>{label}</small></div>}
