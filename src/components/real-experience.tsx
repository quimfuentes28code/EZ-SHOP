"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase/client";
import "@/app/real/real.css";

type Profile = { first_name:string; last_name:string; city:string; phone:string };
type Organization = { id:string; owner_id?:string; name:string; category:string; city:string; description:string; published:boolean };
type Service = { id:string; organization_id:string; title:string; description:string; price_eur:number|null; active:boolean };
type Request = { id:string; organization_id:string; customer_id:string; service_id:string; customer_name:string; customer_email:string; customer_phone:string; notes:string; requested_date:string|null; status:string; created_at:string };
type Contact = { customer_id:string; display_name:string; email:string; phone:string; city:string; last_contact_at:string };
const emptyProfile:Profile={first_name:"",last_name:"",city:"",phone:""};
const errors:Record<string,string>={};
const message=(e:unknown)=> e instanceof Error ? e.message : String(e);
const money=(n:number|null)=>n==null?"Consultar precio":new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR"}).format(n);

export function RealExperience({accountType}:{accountType:"business"|"customer"}){
 const db=getSupabase();
 const [session,setSession]=useState<Session|null>(null);
 const [ready,setReady]=useState(false);
 const [accountRole,setAccountRole]=useState<"business"|"customer"|null|undefined>(undefined);
 const [mode,setMode]=useState<"login"|"signup">("signup");
 const [tab,setTab]=useState<"perfil"|"empresa"|"explorar"|"solicitudes">(accountType==="business"?"empresa":"explorar");
 const [form,setForm]=useState({first:"",last:"",email:"",password:"",phone:"",city:""});
 const [profile,setProfile]=useState<Profile>(emptyProfile);
 const [businessName,setBusinessName]=useState("");
 const [businessCategory,setBusinessCategory]=useState("Servicios profesionales");
 const [businessCity,setBusinessCity]=useState("");
 const [orgs,setOrgs]=useState<Organization[]>([]);
 const [publicOrgs,setPublicOrgs]=useState<Organization[]>([]);
 const [selectedOrg,setSelectedOrg]=useState("");
 const [services,setServices]=useState<Service[]>([]);
 const [publicServices,setPublicServices]=useState<Service[]>([]);
 const [serviceName,setServiceName]=useState("");
 const [servicePrice,setServicePrice]=useState("");
 const [requestService,setRequestService]=useState("");
 const [requestDate,setRequestDate]=useState("");
 const [requestNotes,setRequestNotes]=useState("");
 const [requests,setRequests]=useState<Request[]>([]);
 const [contacts,setContacts]=useState<Contact[]>([]);
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState("");
 const [reload,setReload]=useState(0);
 const refresh=()=>setReload(v=>v+1);

 useEffect(()=>{
   if(!db){setReady(true);return;}
   let active=true;
   db.auth.getSession().then(({data})=>{if(active){setSession(data.session);setReady(true);}});
   const {data:{subscription}}=db.auth.onAuthStateChange((_event,next)=>{
      if(active){setSession(next);setReady(true);}
   });
   return ()=>{active=false;subscription.unsubscribe();};
 },[db]);

 // Account type lives in an immutable database row, never in editable user_metadata.
 useEffect(()=>{
   if(!db||!session?.user?.id){setAccountRole(undefined);return;}
   let active=true;
   setAccountRole(undefined);
   db.from("account_types").select("account_type").eq("user_id",session.user.id).maybeSingle()
     .then(({data,error})=>{
       if(!active)return;
       if(error){setNotice("No se pudo comprobar el tipo de cuenta. Revisa la configuración de Supabase.");setAccountRole(undefined);return;}
       setAccountRole((data?.account_type as "business"|"customer"|undefined)||null);
     });
   return ()=>{active=false;};
 },[db,session?.user?.id]);

 useEffect(()=>{
   if(!db||!session?.user?.id)return;
   let cancelled=false;
   const userId=session.user.id;
   async function fetchData(){
     const [p,o,pub,r]=await Promise.all([
       db!.from("person_profiles").select("first_name,last_name,phone,city").eq("user_id",userId).maybeSingle(),
       db!.from("organizations").select("id,owner_id,name,category,city,description,published").eq("owner_id",userId).order("created_at",{ascending:false}),
       db!.from("organizations").select("id,name,category,city,description,published").eq("published",true).order("created_at",{ascending:false}),
       db!.from("service_requests").select("*").eq("customer_id",userId).order("created_at",{ascending:false})
     ]);
     if(cancelled)return;
     if(p.error||o.error||pub.error||r.error){setNotice("No se pudo cargar la información. Comprueba que has ejecutado la migración SQL y que tu cuenta está confirmada.");return;}
     setProfile((p.data as Profile|null)||emptyProfile);
     const owned=(o.data||[]) as Organization[];
     setOrgs(owned);setPublicOrgs((pub.data||[]) as Organization[]);setRequests((r.data||[]) as Request[]);
     setSelectedOrg(current=>owned.some(x=>x.id===current)?current:owned[0]?.id||"");
   }
   void fetchData();
   return ()=>{cancelled=true;};
 },[db,session?.user?.id,reload]);

 useEffect(()=>{
  if(!db||!session||!selectedOrg){setServices([]);setContacts([]);return;}
  let active=true;
  Promise.all([
   db.from("organization_services").select("*").eq("organization_id",selectedOrg).order("created_at",{ascending:false}),
   db.from("organization_customers").select("customer_id,display_name,email,phone,city,last_contact_at").eq("organization_id",selectedOrg).order("last_contact_at",{ascending:false}),
   db.from("service_requests").select("*").eq("organization_id",selectedOrg).order("created_at",{ascending:false})
  ]).then(([s,c,r])=>{
   if(!active)return;
   setServices((s.data||[]) as Service[]);
   setContacts((c.data||[]) as Contact[]);
   setRequests(current=>{
      const own=(r.data||[]) as Request[];
      return [...own,...current.filter(x=>x.organization_id!==selectedOrg)];
   });
  });
  return ()=>{active=false};
 },[db,session,selectedOrg,reload]);

 useEffect(()=>{
  if(!db||!session){setPublicServices([]);return;}
  let active=true;
  db.from("organization_services").select("*").eq("active",true).then(({data,error})=>{
   if(active){setPublicServices(error?[]:((data||[]) as Service[]));}
  });
  return ()=>{active=false};
 },[db,session,reload]);

 async function work(fn:()=>Promise<void>){
  setBusy(true);setNotice("");
  try { await fn(); }catch(e){setNotice("No se ha podido completar: "+message(e));}
  finally {setBusy(false); }
 }
 const setFormField=(key:keyof typeof form,value:string)=>setForm(old=>({...old,[key]:value}));
 const auth=(e:FormEvent)=>{e.preventDefault();if(!db)return; void work(async()=>{
    if(mode==="signup"){
      if(form.password.length<10)throw Error("Utiliza una contraseña de al menos 10 caracteres.");
      if(!form.first.trim()||!form.last.trim())throw Error("Escribe tu nombre y apellidos.");
      const {data,error}=await db.auth.signUp({
        email:form.email.trim(),password:form.password,
        options:{emailRedirectTo:window.location.origin+(accountType==="business"?"/registro/empresa":"/registro/cliente"),data:{account_type:accountType,first_name:form.first.trim(),last_name:form.last.trim()}}
      });
      if(error)throw error;
      if(data.session){
        const {error:up}=await db.from("person_profiles").update({first_name:form.first.trim(),last_name:form.last.trim(),city:form.city.trim(),phone:form.phone.trim()}).eq("user_id",data.session.user.id);
        if(up)throw up;
        refresh();
        setNotice("Cuenta creada. Revisa tus datos personales.");
      } else setNotice("Revisa tu correo y confirma la cuenta. Después vuelve e inicia sesión.");
    }else{
      const {error}=await db.auth.signInWithPassword({email:form.email.trim(),password:form.password});
      if(error)throw error;
      setNotice("Sesión iniciada correctamente.");
    }
 })};
 const saveProfile=(e:FormEvent)=>{e.preventDefault();if(!db||!session)return;void work(async()=>{
   if(!profile.first_name.trim()||!profile.last_name.trim())throw Error("Nombre y apellidos son necesarios.");
   const {error}=await db.from("person_profiles").update(profile).eq("user_id",session.user.id);
   if(error)throw error;refresh();setNotice("Datos personales guardados.");
 })};
 const addOrg=(e:FormEvent)=>{e.preventDefault();if(!db||!session)return;void work(async()=>{
   const {error}=await db.from("organizations").insert({owner_id:session.user.id,name:businessName.trim(),category:businessCategory,city:businessCity.trim()});
   if(error)throw error;setBusinessName("");refresh();setTab("empresa");setNotice("Negocio creado en privado. Puedes publicarlo cuando añadas tus servicios.");
 })};
 const togglePublish=(org:Organization)=>{if(!db)return;void work(async()=>{
   const {error}=await db.from("organizations").update({published:!org.published}).eq("id",org.id);
   if(error)throw error;refresh();setNotice(!org.published?"Negocio visible en Explorar.":"Negocio oculto del directorio.");
 })};
 const addService=(e:FormEvent)=>{e.preventDefault();if(!db||!selectedOrg)return;void work(async()=>{
   if(serviceName.trim().length<2)throw Error("Indica un nombre de servicio válido.");
   const price=servicePrice.trim()?Number(servicePrice):null;
   if(price!==null&&(!Number.isFinite(price)||price<0||price>1000000))throw Error("Precio no válido.");
   const {error}=await db.from("organization_services").insert({organization_id:selectedOrg,title:serviceName.trim(),price_eur:price});
   if(error)throw error;setServiceName("");setServicePrice("");refresh();setNotice("Servicio guardado.");
 })};
 const sendRequest=(e:FormEvent)=>{e.preventDefault();if(!db||!session)return;void work(async()=>{
   const service=publicServices.find(s=>s.id===requestService);
   if(!service)throw Error("Selecciona un servicio del directorio.");
   if(!profile.first_name.trim())throw Error("Completa antes tu perfil de Cliente.");
   const {error}=await db.from("service_requests").insert({
      organization_id:service.organization_id,service_id:service.id,customer_id:session.user.id,
      notes:requestNotes.trim(),requested_date:requestDate||null
   });
   if(error)throw error;
   setRequestService("");setRequestNotes("");setRequestDate("");refresh();setTab("solicitudes");
   setNotice("Solicitud enviada al negocio. Su CRM ha recibido tu ficha de contacto.");
 })};
 const changeStatus=(request:Request,status:string)=>{if(!db)return;void work(async()=>{
  const {error}=await db.from("service_requests").update({status}).eq("id",request.id);
  if(error)throw error;refresh();setNotice("Estado actualizado.");
 })};
 const logout=()=>{if(!db)return;void work(async()=>{const {error}=await db.auth.signOut();if(error)throw error;setSession(null);setAccountRole(undefined);setOrgs([]);setRequests([]);setContacts([]);setSelectedOrg("");setNotice("Sesión cerrada.");})};
 const enrollExisting=()=>{if(!db||!session)return;void work(async()=>{
  const {error}=await db.from("account_types").insert({user_id:session.user.id,account_type:accountType});
  if(error)throw error;
  setAccountRole(accountType);
  setTab(accountType==="business"?"empresa":"explorar");
  setNotice("Tu cuenta anterior ha quedado registrada como "+(accountType==="business"?"Empresa":"Cliente")+". No podrás cambiar su tipo.");
 })};
 const business=orgs.find(o=>o.id===selectedOrg);
 const ownerRequests=requests.filter(r=>r.organization_id===selectedOrg);
 const myRequests=requests.filter(r=>r.customer_id===session?.user.id);
 return <div className="container live-app" id="live-app">
   <header className="live-top">
    <div><span className="eyebrow">AUTONOSERVICE · {accountType==="business"?"EMPRESAS":"CLIENTE"}</span><h1>{accountType==="business"?"Tu espacio de negocio":"Tu espacio Cliente"}</h1><p>{accountType==="business"?"Gestiona los servicios y los clientes de tu empresa.":"Descubre negocios y consulta tus solicitudes en una cuenta gratuita."}</p></div>
    <Link href="/" className="button secondary small">Volver al inicio</Link>
   </header>
   {!db ? <section className="live-card"><h2>Falta conectar el backend</h2><p>El desarrollo ya está preparado, pero no existe todavía un proyecto Supabase configurado para esta publicación.</p><p>Conecta Supabase y configura las variables públicas de entorno. Nunca pongas una clave secreta en la web.</p><a href="https://supabase.com/dashboard/projects" target="_blank" rel="noreferrer" className="button primary">Crear proyecto Supabase</a></section>
   : !ready ? <p>Comprobando sesión...</p>
   : !session ? <section className="live-card live-auth">
      <h2>{accountType==="business"?"Crear cuenta Empresa":"Crear cuenta Cliente"}</h2>
      <p className="live-muted">Esta cuenta será exclusivamente de {accountType==="business"?"Empresa":"Cliente"}. Para utilizar el otro espacio necesitarás otra cuenta con un correo diferente.</p>
      <div className="live-tabs"><button className={mode==="signup"?"active":""} onClick={()=>setMode("signup")}>Crear cuenta</button><button className={mode==="login"?"active":""} onClick={()=>setMode("login")}>Acceder</button></div>
      <form onSubmit={auth} className="live-form">
       {mode==="signup" && <><label>Nombre<input required maxLength={80} value={form.first} onChange={e=>setFormField("first",e.target.value)} autoComplete="given-name"/></label>
       <label>Apellidos<input required maxLength={100} value={form.last} onChange={e=>setFormField("last",e.target.value)} autoComplete="family-name"/></label>
       <label>Ciudad (opcional)<input maxLength={100} value={form.city} onChange={e=>setFormField("city",e.target.value)} autoComplete="address-level2"/></label>
       <label>Teléfono (opcional)<input type="tel" maxLength={40} value={form.phone} onChange={e=>setFormField("phone",e.target.value)} autoComplete="tel"/></label></>}
       <label>Correo electrónico<input type="email" required value={form.email} onChange={e=>setFormField("email",e.target.value)} autoComplete="email"/></label>
       <label>Contraseña<input type="password" required minLength={10} value={form.password} onChange={e=>setFormField("password",e.target.value)} autoComplete={mode==="signup"?"new-password":"current-password"}/></label>
       <button type="submit" className="button primary" disabled={busy}>{busy?"Procesando...":mode==="signup"?"Crear mi cuenta":"Entrar"}</button>
      </form><p className="live-muted">¿Has elegido el espacio equivocado? <Link href="/">Volver a elegir tipo de cuenta</Link>.</p>
   </section>
   : accountRole === undefined ? <p role="status">Comprobando permisos de la cuenta...</p>
   : accountRole === null ? <section className="live-card live-auth">
      <h2>Completa tu tipo de cuenta</h2>
      <p>Esta cuenta se creó antes de separar las experiencias. Puedes asignarla una sola vez como <strong>{accountType==="business"?"Empresa":"Cliente"}</strong>. No podrás cambiarla después ni usar ambas experiencias desde este correo.</p>
      <button className="button primary" type="button" disabled={busy} onClick={enrollExisting}>Confirmar cuenta {accountType==="business"?"Empresa":"Cliente"}</button>
      <button className="button secondary" type="button" disabled={busy} onClick={logout}>Usar otra cuenta</button>
     </section>
   : accountRole !== accountType ? <section className="live-card live-auth">
      <h2>Esta cuenta pertenece a {accountRole==="business"?"Empresa":"Cliente"}</h2>
      <p>El espacio {accountType==="business"?"Empresa":"Cliente"} necesita una cuenta independiente. Cierra sesión y accede con el correo de ese tipo de cuenta.</p>
      <button className="button primary" type="button" onClick={logout} disabled={busy}>Cerrar sesión para entrar con otra cuenta</button>
     </section>
   : <><div className="live-signed"><span>Sesión de <strong>{session.user.email}</strong></span><div className="live-session-actions"><button type="button" className="button secondary small" onClick={refresh} disabled={busy}>Actualizar datos</button><button className="button secondary small" disabled={busy} onClick={logout}>Cerrar sesión</button></div></div>
      <nav className="live-tabs" aria-label="Espacios conectados">
       {(accountType==="business"?([["empresa","Mi negocio"],["perfil","Mis datos"]] as const):([["explorar","Explorar"],["solicitudes","Mis solicitudes"],["perfil","Mis datos"]] as const)).map(([id,label])=><button key={id} className={tab===id?"active":""} onClick={()=>setTab(id)}>{label}</button>)}
      </nav>
      {tab==="perfil" && <section className="live-card"><h2>{accountType==="business"?"Mis datos personales":"Mis datos de Cliente"}</h2><p className="live-muted">{accountType==="business"?"Estos son tus datos de contacto como propietario. Los datos comerciales se gestionan dentro de Mi negocio.":"Tu nombre, apellidos, correo, teléfono y ciudad se compartirán con el negocio únicamente cuando confirmes una solicitud."}</p>
       <form className="live-form live-columns" onSubmit={saveProfile}>
        <label>Nombre<input required value={profile.first_name} onChange={e=>setProfile(x=>({...x,first_name:e.target.value}))} maxLength={80}/></label>
        <label>Apellidos<input required value={profile.last_name} onChange={e=>setProfile(x=>({...x,last_name:e.target.value}))} maxLength={100}/></label>
        <label>Teléfono de contacto<input type="tel" value={profile.phone} onChange={e=>setProfile(x=>({...x,phone:e.target.value}))} maxLength={40}/></label>
        <label>Ciudad<input value={profile.city} onChange={e=>setProfile(x=>({...x,city:e.target.value}))} maxLength={100}/></label>
        <button className="button primary" disabled={busy}>Guardar mis datos</button>
       </form><p className="live-muted">Email verificado en tu cuenta: {session.user.email}. Los datos fiscales se solicitarán cuando haya facturación real.</p>
      </section>}
      {accountType==="business" && tab==="empresa" && <div className="live-grid">
       <section className="live-card"><h2>Mis negocios</h2>
        {orgs.length ? <><label>Empresa activa<select value={selectedOrg} onChange={e=>setSelectedOrg(e.target.value)}>{orgs.map(org=><option key={org.id} value={org.id}>{org.name}</option>)}</select></label>
        {business && <div className="live-manage"><p><strong>{business.name}</strong> · {business.city || "Sin ciudad"}</p><p>{business.published?"Visible en Explorar":"Perfil privado"}</p>
        <button className="button secondary" disabled={busy} onClick={()=>togglePublish(business)}>{business.published?"Ocultar del directorio":"Publicar negocio"}</button></div>}
        <h3>Añadir servicio</h3><form className="live-form" onSubmit={addService}>
        <label>Servicio<input value={serviceName} onChange={e=>setServiceName(e.target.value)} required maxLength={120} placeholder="Ej. Sesión de fotografía"/></label>
        <label>Precio (€) — opcional<input type="number" min="0" step="0.01" value={servicePrice} onChange={e=>setServicePrice(e.target.value)} placeholder="Consultar"/></label>
        <button className="button primary" disabled={busy}>Guardar servicio</button></form>
        {services.map(s=><div key={s.id} className="live-row"><strong>{s.title}</strong><span>{money(s.price_eur)}</span></div>)}</> : <p className="live-muted">Todavía no tienes negocios registrados.</p>}
        <h3>Registrar otro negocio</h3><form className="live-form" onSubmit={addOrg}>
        <label>Nombre comercial<input value={businessName} onChange={e=>setBusinessName(e.target.value)} required minLength={2} maxLength={120}/></label>
        <label>Sector<input value={businessCategory} onChange={e=>setBusinessCategory(e.target.value)} maxLength={80} required/></label>
        <label>Ciudad<input value={businessCity} onChange={e=>setBusinessCity(e.target.value)} maxLength={100}/></label>
        <button className="button primary" disabled={busy}>Crear negocio</button></form>
       </section>
       <section className="live-card"><h2>CRM · Clientes reales</h2>
        <p className="live-muted">Aquí aparecen únicamente los clientes que han enviado una solicitud a este negocio.</p>
        {contacts.length===0?<p>Aún no hay contactos vinculados.</p>:contacts.map(c=><div className="live-row" key={c.customer_id}><div><strong>{c.display_name}</strong><p>{c.email} {c.phone? "· "+c.phone:""} {c.city?"· "+c.city:""}</p></div></div>)}
        <h3>Solicitudes recibidas</h3>
        {ownerRequests.length===0?<p className="live-muted">Sin solicitudes por ahora.</p>:ownerRequests.map(r=><div key={r.id} className="live-row"><div><strong>{r.customer_name}</strong><p>{r.notes||"Sin notas"} · {r.requested_date||"Sin fecha"}</p><small>{r.status}</small></div><select aria-label={"Estado de "+r.customer_name} value={r.status} disabled={busy} onChange={e=>changeStatus(r,e.target.value)}><option value="new">Nueva</option><option value="accepted">Aceptada</option><option value="rejected">Rechazada</option><option value="completed">Completada</option></select></div>)}
       </section>
      </div>}
      {accountType==="customer" && tab==="explorar" && <section className="live-card"><h2>Explorar negocios inscritos</h2><p className="live-muted">Solo aparecen los negocios publicados y sus servicios activos. El mapa geográfico llegará después de conectar ubicaciones verificadas.</p>
       {publicOrgs.length===0?<p>No hay empresas publicadas todavía.</p>:publicOrgs.map(org=><article key={org.id} className="live-discovery"><div><h3>{org.name}</h3><p>{org.category} · {org.city||"Servicio online"}</p></div>
       {publicServices.filter(s=>s.organization_id===org.id).map(s=><button key={s.id} type="button" className={requestService===s.id?"live-service selected":"live-service"} onClick={()=>setRequestService(s.id)}><span>{s.title}</span><strong>{money(s.price_eur)}</strong></button>)}</article>)}
       {requestService && <form className="live-form live-request" onSubmit={sendRequest}><h3>Solicitar servicio</h3><p className="live-muted">El negocio recibirá tu nombre, correo y teléfono si lo has indicado. Confirma que deseas compartirlos para esta solicitud.</p>
       <label>Fecha deseada (opcional)<input type="date" value={requestDate} onChange={e=>setRequestDate(e.target.value)}/></label>
       <label>¿Qué necesitas?<textarea rows={3} maxLength={2000} value={requestNotes} onChange={e=>setRequestNotes(e.target.value)} placeholder="Describe tu encargo..."/></label>
       <button type="submit" className="button primary" disabled={busy}>Enviar solicitud y compartir mis datos con este negocio</button></form>}
      </section>}
      {accountType==="customer" && tab==="solicitudes" && <section className="live-card"><h2>Mi actividad</h2>
       {myRequests.length===0?<p>No has enviado solicitudes todavía.</p>:myRequests.map(r=><article key={r.id} className="live-row"><div><strong>{publicOrgs.find(o=>o.id===r.organization_id)?.name||"Negocio"}</strong><p>{r.notes||"Solicitud de servicio"} · {r.requested_date||"Sin fecha"}</p></div><span className="live-status">{r.status}</span></article>)}
      </section>}
   </>}
   {notice && <p className="live-alert" role="status">{notice}</p>}
   <p className="live-disclaimer">Fase 1: datos reales solo después de conectar Supabase, ejecutar las políticas RLS y confirmar el registro. No está habilitada la facturación fiscal ni pagos.</p>
 </div>;
}
