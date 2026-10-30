"use client";
import { useEffect,useState,type FormEvent } from "react";
import { MapPin, Plus, Store, Clock3, ShieldCheck, Trash2 } from "lucide-react";
import { getSupabase } from "@/lib/supabase/client";
import { BusinessMap } from "@/components/business-map";
import { Modal } from "@/components/modal";

type Location={
 id:string;organization_id:string;name:string;city:string;address:string;
 service_mode:"local"|"domicilio"|"online"|"mixto";
 availability_mode:"horario"|"cita"|"24h"|"flexible";
 opens_at:string|null;closes_at:string|null;weekdays:string[];
 published:boolean;is_primary:boolean;latitude:number|null;longitude:number|null;
};
const days=[["lun","L"],["mar","M"],["mie","X"],["jue","J"],["vie","V"],["sab","S"],["dom","D"]] as const;
type Draft={name:string;city:string;address:string;service_mode:Location["service_mode"];
 availability_mode:Location["availability_mode"];opens_at:string;closes_at:string;weekdays:string[];published:boolean;
 latitude:number|null;longitude:number|null};
const empty:Draft={name:"",city:"",address:"",service_mode:"local" as Location["service_mode"],
 availability_mode:"cita" as Location["availability_mode"],opens_at:"09:00",closes_at:"18:00",weekdays:["lun","mar","mie","jue","vie"] as string[],published:false,latitude:null,longitude:null};

export function BusinessLocations({organizationId,organizationPublished,onPublishOrganization,publishing=false}:{
 organizationId:string;organizationPublished:boolean;onPublishOrganization?:()=>void;publishing?:boolean;
}){
 const db=getSupabase();
 const [locations,setLocations]=useState<Location[]>([]);
 const [draft,setDraft]=useState(empty);
 const [editing,setEditing]=useState("");
 const [adding,setAdding]=useState(false);
 const [deleting,setDeleting]=useState<Location|null>(null);
 const [deleteConfirmation,setDeleteConfirmation]=useState("");
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const [reload,setReload]=useState(0);
 useEffect(()=>{
   if(!db){setMessage("No hay conexión con la base de datos.");return;}
   let active=true;
   setLocations([]);
   db.from("organization_locations").select("*").eq("organization_id",organizationId)
    .order("is_primary",{ascending:false}).order("created_at",{ascending:true})
    .then(({data,error})=>{if(active){if(error)setMessage(error.message);else setLocations((data||[]) as Location[]);}});
   return ()=>{active=false};
 },[db,organizationId,reload]);
 const update=<K extends keyof typeof draft,>(key:K,value:(typeof draft)[K])=>setDraft(d=>({...d,[key]:value}));
 const startEdit=(l:Location)=>{setEditing(l.id);setAdding(true);setMessage("");setDraft({
   name:l.name,city:l.city,address:l.address,service_mode:l.service_mode,availability_mode:l.availability_mode,
   opens_at:l.opens_at?.slice(0,5)||"09:00",closes_at:l.closes_at?.slice(0,5)||"18:00",
   weekdays:l.weekdays,published:l.published,latitude:l.latitude,longitude:l.longitude
 });};
 const cancel=()=>{setEditing("");setAdding(false);setDraft(empty);};
 const cancelDelete=()=>{setDeleting(null);setDeleteConfirmation("");};
 const deleteLocation=async()=>{
   if(!db||busy||!deleting||deleteConfirmation!==deleting.name)return;
   const target=deleting;
   setBusy(true);setMessage("");
   try{
     const {data,error}=await db.from("organization_locations").delete()
       .eq("id",target.id).eq("organization_id",organizationId).select("id").maybeSingle();
     if(error)throw error;
     if(!data)throw Error("No se ha eliminado la tienda. Comprueba tus permisos y vuelve a intentarlo.");
     if(editing===target.id)cancel();
     setDeleting(null);setDeleteConfirmation("");setReload(n=>n+1);
     setMessage("Tienda «"+target.name+"» eliminada. Tu empresa y las demás sedes siguen intactas.");
   }catch(error){setMessage(error instanceof Error?error.message:"No se pudo eliminar la tienda.");}
   finally{setBusy(false);}
 };
 const submit=async(e:FormEvent)=>{
   e.preventDefault();if(!db||busy)return;
   setBusy(true);setMessage("");
   const payload={
    name:draft.name.trim(),city:draft.city.trim(),address:draft.address.trim(),
    service_mode:draft.service_mode,availability_mode:draft.availability_mode,
    opens_at:draft.availability_mode==="horario"?draft.opens_at:null,
    closes_at:draft.availability_mode==="horario"?draft.closes_at:null,
    weekdays:draft.availability_mode==="horario"?draft.weekdays:[],
    published:draft.published,latitude:draft.latitude,longitude:draft.longitude
   };
   try{
    if(!payload.name||payload.name.length<2)throw Error("Indica un nombre de sede válido.");
    if((payload.latitude===null)!==(payload.longitude===null))
      throw Error("Indica latitud y longitud, o deja ambas vacías para guardar sin pin.");
    if(payload.latitude!==null&&(!Number.isFinite(payload.latitude)||Math.abs(payload.latitude)>90)
      ||payload.longitude!==null&&(!Number.isFinite(payload.longitude)||Math.abs(payload.longitude)>180))
      throw Error("Indica una latitud entre −90 y 90 y una longitud entre −180 y 180.");
    if(draft.availability_mode==="horario"&&(!payload.weekdays.length||payload.opens_at===payload.closes_at))
      throw Error("Selecciona días y horas válidas.");
    const result=editing?
      await db.from("organization_locations").update(payload).eq("id",editing).eq("organization_id",organizationId).select("id").single():
      await db.from("organization_locations").insert({...payload,organization_id:organizationId}).select("id").single();
    if(result.error)throw result.error;
    if(!result.data)throw Error("No se ha guardado la sede. Comprueba tus permisos y vuelve a intentarlo.");
    const saved=editing?"Sede actualizada.":"Nueva tienda añadida.";
    setMessage(saved+(!payload.published?" Sede privada.":!organizationPublished
      ?" La sede está preparada para publicarse, pero tu negocio sigue privado. Publica también el negocio para aparecer en Cliente."
      :payload.latitude===null?" Visible en el perfil, sin pin en el mapa.":" Visible en el perfil y en el mapa de Cliente."));
    setEditing("");setAdding(false);setDraft(empty);setReload(n=>n+1);
   }catch(error){setMessage(error instanceof Error?error.message:"No se ha podido guardar la sede.");}
   finally{setBusy(false);}
 };
 return <section className="live-card live-locations">
  <div className="business-live-section-head">
   <div><span className="eyebrow">MIS TIENDAS</span><h2>Sedes y ubicaciones</h2>
    <p className="live-muted">Una empresa, varios establecimientos. Cada tienda puede tener su ubicación, modalidad de atención y horarios.</p>
   </div>
   <button className="button primary" type="button" disabled={busy} onClick={()=>{cancel();setAdding(true);}}><Plus size={16}/> Añadir tienda</button>
  </div>
  <div className="business-live-publication">
    <div><strong>{organizationPublished?"Negocio público":"Negocio privado"}</strong>
      <p>Para aparecer en el mapa de Cliente, publica el negocio, autoriza la visibilidad de esta sede y guarda su pin. Puedes publicar una sede sin compartir una dirección postal.</p>
      {!organizationPublished&&<p>Publicar el negocio mostrará su perfil comercial y las sedes y publicaciones que hayas marcado como públicas.</p>}
    </div>
    {!organizationPublished&&onPublishOrganization&&<button className="button secondary" type="button" disabled={busy||publishing} onClick={onPublishOrganization}>Publicar negocio</button>}
  </div>
  <div className="location-list">
    {locations.map(l=><article className="location-card" key={l.id}>
      <div className="location-avatar"><Store size={22}/></div>
      <div className="location-info">
        <strong>{l.name}{l.is_primary&&<span className="location-primary">Principal</span>}</strong>
        <p><MapPin size={13}/>{[l.address,l.city].filter(Boolean).join(" · ")||"Ubicación por completar"}</p>
        <p><Clock3 size={13}/>{({horario:"Horario fijo",cita:"Solo con cita",flexible:"Horario flexible","24h":"Atención 24 h"} as const)[l.availability_mode]} · {({local:"En establecimiento",domicilio:"A domicilio",online:"Online",mixto:"Mixto"} as const)[l.service_mode]}</p>
        <small>{!l.published?"Sede privada":organizationPublished?"Sede visible en el perfil público":"Sede preparada; negocio privado"} · {l.latitude!==null&&l.longitude!==null?"Ubicación marcada en mapa":"Sin pin exacto"}</small>
      </div>
      <div className="live-session-actions">
        <button className="button secondary small" type="button" disabled={busy} onClick={()=>startEdit(l)}>Editar</button>
        <button className="button secondary small" type="button" disabled={busy} aria-label={"Eliminar tienda "+l.name}
          onClick={()=>{setDeleting(l);setDeleteConfirmation("");setMessage("");}}><Trash2 size={14}/> Eliminar</button>
      </div>
    </article>)}
    {locations.length===0&&!message&&<p className="live-muted">Aún no hay sedes registradas.</p>}
  </div>
  {deleting&&<Modal title={"Eliminar tienda «"+deleting.name+"»"} onClose={cancelDelete}>
    <p>Eliminarás definitivamente esta sede, su dirección, horario y pin. Tu empresa, las demás sedes, servicios, clientes y conversaciones se conservarán.</p>
    {deleting.is_primary&&<p>Es la sede principal. Al eliminarla no se asignará otra automáticamente.</p>}
    <form className="live-form" onSubmit={e=>{e.preventDefault();void deleteLocation();}}>
      <label>Nombre de la tienda para confirmar<input autoComplete="off" value={deleteConfirmation}
        disabled={busy} onChange={e=>setDeleteConfirmation(e.target.value)}/></label>
      <p>Escribe exactamente: <strong>{deleting.name}</strong></p>
      <div className="live-session-actions">
        <button className="button secondary" type="button" disabled={busy} onClick={cancelDelete}>Cancelar</button>
        <button className="button primary" type="submit" disabled={busy||deleteConfirmation!==deleting.name}>Eliminar definitivamente</button>
      </div>
    </form>
    {message&&<p className="live-alert" role="status">{message}</p>}
  </Modal>}
  {adding&&<form className="location-form" onSubmit={submit}>
    <h3>{editing?"Editar tienda":"Añadir otra tienda"}</h3>
    <div className="location-fields">
      <label>Nombre de la tienda<input required minLength={2} maxLength={120} placeholder="Ej. Tienda Centro" value={draft.name} onChange={e=>update("name",e.target.value)}/></label>
      <label>Ciudad<input maxLength={100} placeholder="Ej. Terrassa" value={draft.city} onChange={e=>update("city",e.target.value)}/></label>
      <label className="location-wide">Dirección (opcional)<input maxLength={250} placeholder="Calle y número, si quieres compartirlos" value={draft.address} onChange={e=>update("address",e.target.value)}/></label>
      <label>Modalidad<select value={draft.service_mode} onChange={e=>update("service_mode",e.target.value as Location["service_mode"])}>
        <option value="local">En el establecimiento</option><option value="domicilio">A domicilio</option><option value="online">Online</option><option value="mixto">Mixta</option>
      </select></label>
      <label>Disponibilidad<select value={draft.availability_mode} onChange={e=>update("availability_mode",e.target.value as Location["availability_mode"])}>
        <option value="cita">Solo con cita</option><option value="horario">Horario fijo</option><option value="flexible">Horario flexible</option><option value="24h">Atención 24 h</option>
      </select></label>
      {draft.availability_mode==="horario"&&<>
        <label>Abre<input type="time" required value={draft.opens_at} onChange={e=>update("opens_at",e.target.value)}/></label>
        <label>Cierra<input type="time" required value={draft.closes_at} onChange={e=>update("closes_at",e.target.value)}/></label>
        <div className="location-weekdays location-wide" aria-label="Días de apertura">
          {days.map(([day,short])=><label key={day}><input type="checkbox" checked={draft.weekdays.includes(day)} onChange={e=>update("weekdays",e.target.checked?[...draft.weekdays,day]:draft.weekdays.filter(d=>d!==day))}/><span>{short}</span></label>)}
        </div>
      </>}
      <div className="location-wide">
        <strong>Coloca tu tienda en el mapa (opcional)</strong>
        <p className="live-muted">Mueve el mapa y pulsa en el punto exacto. La dirección y el pin no se compartirán con los clientes a menos que publiques la sede.</p>
        <BusinessMap points={[]} editable
          initialPoint={draft.latitude!==null&&draft.longitude!==null?{latitude:draft.latitude,longitude:draft.longitude}:null}
          onPick={(latitude,longitude)=>setDraft(d=>({...d,latitude,longitude}))} height={310}/>
        <p className="live-muted">También puedes introducir las coordenadas manualmente. Déjalas vacías para guardar sin pin.</p>
        <div className="location-fields">
          <label>Latitud<input type="number" inputMode="decimal" min="-90" max="90" step="any" value={draft.latitude??""}
            onChange={e=>update("latitude",e.target.value===""?null:Number(e.target.value))}/></label>
          <label>Longitud<input type="number" inputMode="decimal" min="-180" max="180" step="any" value={draft.longitude??""}
            onChange={e=>update("longitude",e.target.value===""?null:Number(e.target.value))}/></label>
        </div>
        {draft.latitude!==null&&draft.longitude!==null&&<p className="live-muted">Posición: {draft.latitude.toFixed(6)}, {draft.longitude.toFixed(6)}. <button className="button secondary small" type="button" onClick={()=>setDraft(d=>({...d,latitude:null,longitude:null}))}>Quitar pin</button></p>}
      </div>
      <label className="location-wide location-publish"><input type="checkbox" checked={draft.published} onChange={e=>update("published",e.target.checked)}/>
        <span>Mostrar esta sede en el perfil público de la empresa (incluida su dirección si la añades)</span>
      </label>
    </div>
    <div className="live-session-actions"><button className="button primary" disabled={busy} type="submit">Guardar tienda</button><button className="button secondary" disabled={busy} onClick={cancel} type="button">Cancelar</button></div>
  </form>}
  {message&&<p className="live-alert" role="status">{message}</p>}
  <p className="live-muted location-privacy"><ShieldCheck size={13}/> La dirección solo se mostrará a los clientes si publicas expresamente esta sede. Los servicios se comparten a nivel de empresa; la disponibilidad de reservas por sede se añadirá después.</p>
 </section>;
}
