"use client";
import { useEffect,useState,type FormEvent } from "react";
import { CalendarDays, ClipboardList, FileText, FolderKanban, Package, Wrench, Plus, ShieldCheck } from "lucide-react";
import { getSupabase } from "@/lib/supabase/client";

type Kind="project"|"appointment"|"quote"|"work_order"|"order";
type Status="pending"|"in_progress"|"done"|"cancelled";
type Item={id:string;organization_id:string;kind:Kind;title:string;details:string;status:Status;scheduled_date:string|null;amount_eur:number|null;created_at:string};
const categories:{kind:Kind;label:string;icon:typeof CalendarDays}[]=[
 {kind:"project",label:"Proyectos",icon:FolderKanban},
 {kind:"appointment",label:"Agenda interna",icon:CalendarDays},
 {kind:"quote",label:"Presupuestos borrador",icon:FileText},
 {kind:"work_order",label:"Órdenes de trabajo",icon:Wrench},
 {kind:"order",label:"Encargos internos",icon:Package}
];
const states:{value:Status;label:string}[]=[
 {value:"pending",label:"Pendiente"},{value:"in_progress",label:"En curso"},
 {value:"done",label:"Completado"},{value:"cancelled",label:"Cancelado"}
];
export function BusinessWorkboard({organizationId,initialKind}:{organizationId:string;initialKind?:Kind}){
 const db=getSupabase();
 const [kind,setKind]=useState<Kind>(initialKind||"project");
 const [items,setItems]=useState<Item[]>([]);
 const [title,setTitle]=useState("");const [details,setDetails]=useState("");
 const [date,setDate]=useState("");const [amount,setAmount]=useState("");
 const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
 const [reload,setReload]=useState(0);
 useEffect(()=>{
  if(!db||!organizationId)return;
  let active=true;
  db.from("business_work_items").select("*").eq("organization_id",organizationId).order("created_at",{ascending:false})
   .then(({data,error})=>{if(active){if(error)setMessage(error.message);else setItems((data||[]) as Item[]);}});
  return ()=>{active=false;};
 },[db,organizationId,reload]);
 const current=items.filter(x=>x.kind===kind);
 async function create(e:FormEvent){
  e.preventDefault();if(!db||busy)return;
  setMessage("");setBusy(true);
  try{
   const amountValue=amount.trim()?Number(amount):null;
   if(amountValue!==null&&(!Number.isFinite(amountValue)||amountValue<0))throw Error("Importe no válido.");
   const {error}=await db.from("business_work_items").insert({
    organization_id:organizationId,kind,title:title.trim(),details:details.trim(),
    scheduled_date:date||null,amount_eur:kind==="quote"?amountValue:null
   });
   if(error)throw error;
   setTitle("");setDetails("");setDate("");setAmount("");setReload(n=>n+1);
   setMessage("Guardado en el espacio privado de tu empresa.");
  }catch(err){setMessage(err instanceof Error?err.message:"No se pudo guardar.");}
  finally{setBusy(false);}
 }
 async function changeStatus(item:Item,status:Status){
  if(!db)return;setBusy(true);setMessage("");
  const {error}=await db.from("business_work_items").update({status}).eq("organization_id",organizationId).eq("id",item.id);
  setBusy(false);if(error)setMessage(error.message);else setReload(n=>n+1);
 }
 return <section className="live-card live-workboard">
  <div className="business-live-section-head"><div>
   <span className="eyebrow">GESTIÓN PROFESIONAL</span><h2>Organiza tu trabajo</h2>
   <p className="live-muted">Agenda interna, proyectos, encargos y presupuestos borrador con datos reales de tu empresa.</p>
  </div></div>
  <nav className="workboard-tabs" aria-label="Herramientas de gestión">
   {categories.map(({kind:id,label,icon:Icon})=><button type="button" key={id} className={id===kind?"active":""} onClick={()=>setKind(id)}>
    <Icon size={17}/>{label}<span>{items.filter(x=>x.kind===id).length}</span>
   </button>)}
  </nav>
  <form className="workboard-form" onSubmit={create}>
   <div className="business-live-section-head"><h3>Nuevo {categories.find(x=>x.kind===kind)?.label.toLocaleLowerCase("es")}</h3></div>
   <div className="workboard-fields">
    <label>Título<input required minLength={2} maxLength={160} value={title} onChange={e=>setTitle(e.target.value)} placeholder={kind==="appointment"?"Ej. Reunión para sesión de fotos":"Nombre o referencia del trabajo"}/></label>
    <label>{kind==="appointment"?"Fecha prevista":"Fecha objetivo (opcional)"}<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>
    {kind==="quote"&&<label>Importe aproximado (€)<input type="number" min="0" max="10000000" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)}/></label>}
    <label className="workboard-wide">Notas y descripción<textarea maxLength={4000} rows={3} value={details} onChange={e=>setDetails(e.target.value)} placeholder="Datos y tareas del trabajo (no incluyas información especialmente sensible)."/></label>
   </div>
   <button className="button primary" type="submit" disabled={busy||!organizationId}><Plus size={15}/> Crear registro</button>
  </form>
  <div className="workboard-list">
   {current.length===0&&<div className="business-live-empty"><ClipboardList size={23}/><strong>Sin registros todavía</strong><p>Los nuevos registros aparecerán aquí y estarán disponibles cuando vuelvas a iniciar sesión.</p></div>}
   {current.map(item=><article key={item.id} className="workboard-item">
     <div className="workboard-item-content"><strong>{item.title}</strong><p>{item.details||"Sin comentarios"}</p><small>{item.scheduled_date?"Fecha objetivo: "+item.scheduled_date:"Sin fecha"}{item.amount_eur!==null?" · "+new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR"}).format(item.amount_eur):""}</small></div>
     <label>Estado<select disabled={busy} value={item.status} onChange={e=>changeStatus(item,e.target.value as Status)}>
       {states.map(st=><option key={st.value} value={st.value}>{st.label}</option>)}
      </select></label>
   </article>)}
  </div>
  {message&&<p className="live-alert" role="status">{message}</p>}
  <p className="live-muted"><ShieldCheck size={13} style={{display:"inline",verticalAlign:"middle"}}/> Estos registros son internos. Las citas aún no bloquean disponibilidad pública; los presupuestos son borradores y no se envían ni se facturan automáticamente.</p>
 </section>;
}
