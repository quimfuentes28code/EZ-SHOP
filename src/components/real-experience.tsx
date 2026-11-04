"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, UserRound, ArrowLeft, UsersRound, Settings2, ShoppingBag, ClipboardList, Blocks, MessageCircle, LayoutGrid, ArrowRight } from "lucide-react";
import { CustomerSocial } from "@/components/customer-social";
import { BusinessLocations } from "@/components/business-locations";
import { BusinessWorkboard } from "@/components/business-workboard";
import { BusinessSocialEditor } from "@/components/business-social-editor";
import { SocialInbox } from "@/components/social-inbox";
import { BusinessHome, BusinessTools, BusinessManagement, type BusinessArea } from "@/components/business-home";
import { Brand } from "@/components/brand";
import { AppBottomNavigation, DesktopBusinessNavigation, AccountActions } from "@/components/app-navigation";
import { businessPrimarySection } from "@/lib/app-navigation";
import { AccountExperienceSwitcher } from "@/components/account-experience-switcher";
import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase/client";
import "@/app/real/real.css";
import "@/app/empresa/workspace.css";

type Profile = { first_name:string; last_name:string; city:string; phone:string };
type Organization = { id:string; owner_id?:string; name:string; category:string; city:string; description:string; published:boolean };
type Service = { id:string; organization_id:string; title:string; description:string; price_eur:number|null; active:boolean };
type Request = { id:string; organization_id:string; customer_id:string; service_id:string; customer_name:string; customer_email:string; customer_phone:string; notes:string; requested_date:string|null; status:string; created_at:string };
type Contact = { customer_id:string; display_name:string; email:string; phone:string; city:string; last_contact_at:string };
type OrganizationData={organizationId:string;userId:string;services:Service[];contacts:Contact[];requests:Request[];loading:boolean;error:string};
const emptyProfile:Profile={first_name:"",last_name:"",city:"",phone:""};
const errors:Record<string,string>={};
const message=(e:unknown)=> e instanceof Error ? e.message : String(e);
const money=(n:number|null)=>n==null?"Consultar precio":new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR"}).format(n);

export function RealExperience({accountType}:{accountType:"business"|"customer"}){
 const db=getSupabase();
 const router=useRouter();
 const pathname=usePathname();
 const registrationPath=accountType==="business"?"/registro/empresa":"/registro/cliente";
 const homePath=accountType==="business"?"/empresa":"/cliente";
 const [session,setSession]=useState<Session|null>(null);
 const [ready,setReady]=useState(false);
 const [accountRole,setAccountRole]=useState<"business"|"customer"|null|undefined>(undefined);
 const [mode,setMode]=useState<"login"|"signup">("signup");
 const [tab,setTabState]=useState<BusinessArea|"explorar"|"solicitudes">(accountType==="business"?"inicio":"explorar");
 const [profileSection,setProfileSection]=useState<"general"|"appearance"|"services"|"posts"|"locations"|"visibility"|"preview">("general");
 const [profileVisited,setProfileVisited]=useState(false);
 const [messagesVisited,setMessagesVisited]=useState(false);
 const [workboardVisited,setWorkboardVisited]=useState(false);
 const setTab=(next:BusinessArea|"explorar"|"solicitudes")=>{
   const target=next==="diseno"?"negocio":next;
   if(next==="diseno")setProfileSection("appearance");
   else if(next==="negocio")setProfileSection("general");
   if(target==="negocio")setProfileVisited(true);
   if(target==="mensajes")setMessagesVisited(true);
   if(target==="agenda"||target==="workboard")setWorkboardVisited(true);
   setTabState(target);
   if(accountType==="business"&&pathname==="/empresa"){
     const url=new URL(window.location.href);
     url.searchParams.delete("vista");url.searchParams.delete("editor");url.searchParams.delete("tab");
     if(target==="inicio")url.searchParams.delete("seccion");else url.searchParams.set("seccion",target==="perfil"?"cuenta":target==="negocio"?"perfil":target==="gestion"?"servicios":target==="gestion-hub"?"gestion":target);
     if(target==="negocio"&&next==="diseno")url.searchParams.set("panel","appearance");else url.searchParams.delete("panel");
     if(url.href!==window.location.href)window.history.pushState({...window.history.state},"",url);
   }
 };
 const openProfileSection=(section:typeof profileSection)=>{
   setProfileVisited(true);setProfileSection(section);setTabState("negocio");
   const url=new URL(window.location.href);url.searchParams.set("seccion","perfil");
   if(section==="general")url.searchParams.delete("panel");else url.searchParams.set("panel",section);
   url.searchParams.delete("vista");url.searchParams.delete("editor");url.searchParams.delete("tab");
   if(url.href!==window.location.href)window.history.pushState({...window.history.state},"",url);
 };
 useEffect(()=>{
   if(accountType!=="business"||pathname!=="/empresa")return;
   const sync=()=>{
     const params=new URLSearchParams(window.location.search);
     const value=params.get("seccion")||params.get("vista")||params.get("tab")||"inicio";
     const aliases:Record<string,BusinessArea>={inicio:"inicio",agenda:"agenda",mensajes:"mensajes",gestion:"gestion-hub",servicios:"gestion",clientes:"clientes","solicitudes-empresa":"solicitudes-empresa",solicitudes:"solicitudes-empresa",sedes:"sedes",workboard:"workboard",herramientas:"herramientas",perfil:"negocio",negocio:"negocio",diseno:"negocio",cuenta:"perfil"};
     const target=params.get("editor")==="diseno"?"negocio":aliases[value]||"inicio";
     setTabState(target);
     const panel=params.get("panel");
     setProfileSection(params.get("editor")==="diseno"||value==="diseno"?"appearance":panel&&["general","appearance","services","posts","locations","visibility","preview"].includes(panel)?panel as typeof profileSection:"general");
     if(target==="negocio")setProfileVisited(true);
   if(target==="mensajes")setMessagesVisited(true);
     if(target==="agenda"||target==="workboard")setWorkboardVisited(true);
   };
   sync();window.addEventListener("popstate",sync);return()=>window.removeEventListener("popstate",sync);
 },[accountType,pathname]);
 const [form,setForm]=useState({first:"",last:"",email:"",password:"",phone:"",city:""});
 const [profile,setProfile]=useState<Profile>(emptyProfile);
 const [businessName,setBusinessName]=useState("");
 const [businessCategory,setBusinessCategory]=useState("Servicios profesionales");
 const [businessCity,setBusinessCity]=useState("");
 const [companyDraft,setCompanyDraft]=useState({name:"",category:"",city:"",description:""});
 const [orgs,setOrgs]=useState<Organization[]>([]);
 const [publicOrgs,setPublicOrgs]=useState<Organization[]>([]);
 const [selectedOrg,setSelectedOrg]=useState("");
 const [organizationData,setOrganizationData]=useState<OrganizationData|null>(null);
 const [publicServices,setPublicServices]=useState<Service[]>([]);
 const [serviceName,setServiceName]=useState("");
 const [servicePrice,setServicePrice]=useState("");
 const [requestService,setRequestService]=useState("");
 const [requestDate,setRequestDate]=useState("");
 const [requestNotes,setRequestNotes]=useState("");
 const [requests,setRequests]=useState<Request[]>([]);
 const contextMatches=organizationData?.organizationId===selectedOrg&&organizationData?.userId===session?.user.id;
 const contextReady=Boolean(contextMatches&&!organizationData?.loading&&!organizationData?.error);
 const services=contextReady?organizationData!.services:[];
 const contacts=contextReady?organizationData!.contacts:[];
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState("");
 const [reload,setReload]=useState(0);
 // Registration stays within the app: after login, open the canonical role dashboard.
 // Canonical pages do not expose demo content when there is no signed-in session.
 useEffect(()=>{
   if(!ready)return;
   if((pathname==="/empresa"||pathname==="/cliente")&&!session){
     router.replace(registrationPath);
   } else if(pathname===registrationPath && session && accountRole===accountType){
     router.replace(homePath);
   }
 },[ready,pathname,router,registrationPath,homePath,session,accountRole,accountType]);
 const refresh=()=>setReload(v=>v+1);
 useEffect(()=>{
   const org=orgs.find(o=>o.id===selectedOrg);
   if(org) setCompanyDraft({name:org.name,category:org.category,city:org.city,description:org.description});
 },[orgs,selectedOrg]);

 useEffect(()=>{
   if(!db){setReady(true);return;}
   let active=true;
   db.auth.getSession().then(({data})=>{if(active){setSession(data.session);setReady(true);}});
   const {data:{subscription}}=db.auth.onAuthStateChange((_event,next)=>{
      if(active){setSession(next);setReady(true);}
   });
   return ()=>{active=false;subscription.unsubscribe();};
 },[db]);

 // Workspace memberships live in protected database rows, never editable user_metadata.
// One authenticated user can have both Empresa and Cliente memberships.
 useEffect(()=>{
   if(!db||!session?.user?.id){setAccountRole(undefined);return;}
   let active=true;
   setAccountRole(undefined);
   db.from("account_types").select("account_type").eq("user_id",session.user.id)
     .then(({data,error})=>{
       if(!active)return;
       if(error){setNotice("No se pudo comprobar el tipo de cuenta. Revisa la configuración de Supabase.");setAccountRole(undefined);return;}
       setAccountRole(data?.some(row=>row.account_type===accountType)?accountType:null);
     });
   return ()=>{active=false;};
 },[db,session?.user?.id,accountType]);

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
  if(!db||!session||!selectedOrg){setOrganizationData(null);return;}
  let active=true;
  const context={organizationId:selectedOrg,userId:session.user.id};
  setOrganizationData({...context,services:[],contacts:[],requests:[],loading:true,error:""});
  setServiceName("");setServicePrice("");
  Promise.all([
   db.from("organization_services").select("*").eq("organization_id",selectedOrg).order("created_at",{ascending:false}),
   db.from("organization_customers").select("customer_id,display_name,email,phone,city,last_contact_at").eq("organization_id",selectedOrg).order("last_contact_at",{ascending:false}),
   db.from("service_requests").select("*").eq("organization_id",selectedOrg).order("created_at",{ascending:false})
  ]).then(([s,c,r])=>{
   if(!active)return;
   const error=s.error||c.error||r.error;
   setOrganizationData({...context,
     services:error?[]:(s.data||[]) as Service[],contacts:error?[]:(c.data||[]) as Contact[],
     requests:error?[]:(r.data||[]) as Request[],loading:false,
     error:error?"No se pudieron cargar los servicios, clientes y solicitudes de esta empresa.":""});
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
        options:{emailRedirectTo:window.location.origin+(accountType==="business"?"/registro/empresa":"/registro/cliente"),data:{account_type:accountType,first_name:form.first.trim(),last_name:form.last.trim(),city:form.city.trim(),phone:form.phone.trim()}}
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
   if(error)throw error;setBusinessName("");refresh();setTab("sedes");setNotice("Negocio creado. Ya puedes completar el perfil y añadir servicios.");
 })};
 const saveCompany=(e:FormEvent)=>{e.preventDefault();if(!db||!selectedOrg)return;void work(async()=>{
    if(companyDraft.name.trim().length<2)throw Error("El nombre comercial debe tener al menos 2 caracteres.");
    const {data,error}=await db.from("organizations").update({
      name:companyDraft.name.trim(),category:companyDraft.category.trim()||"Otros",
      city:companyDraft.city.trim(),description:companyDraft.description.trim()
    }).eq("id",selectedOrg).select("id").maybeSingle();
    if(error)throw error;
    if(!data)throw Error("No se pudo guardar el perfil. Comprueba que eres el propietario.");
    refresh();setNotice("Perfil comercial guardado.");
 })};
 const togglePublish=(org:Organization)=>{if(!db)return;void work(async()=>{
   const published=!org.published;
   const {data,error}=await db.from("organizations").update({published}).eq("id",org.id).select("id,published").maybeSingle();
   if(error)throw error;
   if(!data||data.published!==published)throw Error("No se pudo cambiar la visibilidad. Comprueba tus permisos y vuelve a intentarlo.");
   setOrgs(current=>current.map(item=>item.id===org.id?{...item,published}:item));
   refresh();setNotice(published?"Negocio visible en Explorar. Las sedes con pin y visibilidad autorizada aparecen en el mapa de Cliente.":"Negocio oculto del directorio y del mapa de Cliente.");
 })};
 const addService=(e:FormEvent)=>{e.preventDefault();if(!db||!selectedOrg)return;void work(async()=>{
   if(!contextReady)throw Error("Espera a que se carguen los datos de la empresa activa antes de añadir un servicio.");
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
  if(!contextReady||request.organization_id!==selectedOrg)throw Error("La solicitud no pertenece a la empresa activa.");
  const {error}=await db.from("service_requests").update({status}).eq("id",request.id).eq("organization_id",selectedOrg);
  if(error)throw error;refresh();setNotice("Estado actualizado.");
 })};
 const logout=()=>{if(!db)return;void work(async()=>{const {error}=await db.auth.signOut();if(error)throw error;setSession(null);setAccountRole(undefined);setOrgs([]);setRequests([]);setOrganizationData(null);setSelectedOrg("");setNotice("Sesión cerrada.");})};
 const enrollExisting=()=>{if(!db||!session)return;void work(async()=>{
  const {error}=await db.from("account_types").insert({user_id:session.user.id,account_type:accountType});
  if(error)throw error;
  setAccountRole(accountType);
  setTab(accountType==="business"?"inicio":"explorar");
  setNotice("Espacio "+(accountType==="business"?"Empresa":"Cliente")+" activado en tu cuenta. Ahora puedes utilizar ambos espacios con el mismo correo.");
 })};
 const business=orgs.find(o=>o.id===selectedOrg);
 const ownerRequests=contextReady?organizationData!.requests:[];
 const myRequests=requests.filter(r=>r.customer_id===session?.user.id);
 const content = <div className="container live-app" id="live-app">
   <header className={accountType==="business"&&session&&accountRole==="business"?"live-top business-content-heading":"live-top"}>
    <div><span className="eyebrow">AUTONOSERVICE · {accountType==="business"?"EMPRESAS":"CLIENTE"}</span><h1>{accountType==="business"?(tab==="inicio"?"Inicio":tab==="gestion-hub"?"Gestión":tab==="agenda"?"Agenda":tab==="negocio"?"Perfil público":tab==="perfil"?"Mi cuenta":"Tu negocio"):"Tu espacio Cliente"}</h1><p>{accountType==="business"?"Gestiona los servicios y los clientes de tu empresa.":"Descubre negocios y consulta tus solicitudes en una cuenta gratuita."}</p></div>
    <Link href="/" className="button secondary small">Volver al inicio</Link>
   </header>
   {!db ? <section className="live-card"><h2>Falta conectar el backend</h2><p>El desarrollo ya está preparado, pero no existe todavía un proyecto Supabase configurado para esta publicación.</p><p>Conecta Supabase y configura las variables públicas de entorno. Nunca pongas una clave secreta en la web.</p><a href="https://supabase.com/dashboard/projects" target="_blank" rel="noreferrer" className="button primary">Crear proyecto Supabase</a></section>
   : !ready ? <p>Comprobando sesión...</p>
   : !session ? <section className="live-card live-auth">
      <h2>{accountType==="business"?"Cuenta Empresa":"Cuenta Cliente"}</h2>
      <p className="live-muted">Puedes usar el mismo correo electrónico para Empresa y Cliente. Si ya tienes una cuenta, pulsa «Acceder» y utiliza tu contraseña habitual para activar este espacio.</p>
      <div className="live-tabs"><button className={mode==="signup"?"active":""} onClick={()=>setMode("signup")}>Crear cuenta</button><button className={mode==="login"?"active":""} onClick={()=>setMode("login")}>Acceder</button></div>
      <form onSubmit={auth} className="live-form">
       {mode==="signup" && <><label>Nombre<input required maxLength={80} value={form.first} onChange={e=>setFormField("first",e.target.value)} autoComplete="given-name"/></label>
       <label>Apellidos<input required maxLength={100} value={form.last} onChange={e=>setFormField("last",e.target.value)} autoComplete="family-name"/></label>
       <label>Ciudad (opcional)<input maxLength={100} value={form.city} onChange={e=>setFormField("city",e.target.value)} autoComplete="address-level2"/></label>
       <label>Teléfono (opcional)<input type="tel" maxLength={40} value={form.phone} onChange={e=>setFormField("phone",e.target.value)} autoComplete="tel"/></label></>}
       <label>Correo electrónico<input type="email" required value={form.email} onChange={e=>setFormField("email",e.target.value)} autoComplete="email"/></label>
       <label>Contraseña<input type="password" required minLength={10} value={form.password} onChange={e=>setFormField("password",e.target.value)} autoComplete={mode==="signup"?"new-password":"current-password"}/></label>
       <button type="submit" className="button primary" disabled={busy}>{busy?"Procesando...":mode==="signup"?"Crear mi cuenta":"Entrar"}</button>
      </form><p className="live-muted">{mode==="signup"?"¿Ya tienes una cuenta Empresa o Cliente? Inicia sesión con ese mismo correo para activar este espacio.":"Después de entrar, podrás activar este espacio sin volver a registrarte."} <Link href="/">Volver al inicio</Link>.</p>
   </section>
   : accountRole === undefined ? <p role="status">Comprobando permisos de la cuenta...</p>
   : accountRole === null ? <section className="live-card live-auth">
      <AccountExperienceSwitcher experience={accountType}/>
      <h2>Activar espacio {accountType==="business"?"Empresa":"Cliente"}</h2>
      <p>Ya tienes una cuenta con <strong>{session.user.email}</strong>. Puedes activar también el espacio <strong>{accountType==="business"?"Empresa":"Cliente"}</strong> utilizando este mismo correo y contraseña.</p>
      <p className="live-muted">Los negocios y el CRM seguirán asociados a tu espacio Empresa. En Cliente podrás explorar servicios, hacer solicitudes y consultar tu actividad personal. No perderás lo que ya tienes creado.</p>
      <div className="live-session-actions">
        <button className="button primary" type="button" disabled={busy} onClick={enrollExisting}>Activar {accountType==="business"?"Empresa":"Cliente"} con esta cuenta</button>
        <button className="button secondary" type="button" disabled={busy} onClick={logout}>Usar otro correo</button>
      </div>
     </section>
   : accountRole !== accountType ? <section className="live-card live-auth">
      <h2>Activa tu espacio {accountType==="business"?"Empresa":"Cliente"}</h2>
      <p>Con la misma identidad puedes utilizar ambos espacios. Si todavía no has habilitado este, vuelve a acceder para activarlo.</p>
      <button className="button primary" type="button" onClick={()=>{setAccountRole(null);}} disabled={busy}>Continuar</button>
     </section>
   : <>
      {accountType==="customer"&&<nav className="live-tabs" aria-label="Espacios conectados">{([["explorar","Explorar"],["solicitudes","Mis solicitudes"],["perfil","Mis datos"]] as const).map(([id,label])=><button key={id} className={tab===id?"active":""} onClick={()=>setTab(id)}>{label}</button>)}</nav>}
      {accountType==="business"&&["gestion","clientes","solicitudes-empresa","sedes","herramientas","workboard"].includes(tab)&&<div className="business-section-back"><button type="button" className="button secondary small" onClick={()=>setTab("gestion-hub")}><ArrowLeft size={15}/> Gestión</button></div>}
      {accountType==="business"&&tab==="gestion-hub"&&<BusinessManagement onNavigate={setTab} hasOrganization={Boolean(selectedOrg)}/>}
      {accountType==="business"&&selectedOrg&&["inicio","gestion","clientes","solicitudes-empresa"].includes(tab)&&(
        !contextMatches||organizationData?.loading?<p role="status">Cargando datos de la empresa activa...</p>
        :organizationData?.error?<div className="live-alert" role="status"><p>{organizationData.error}</p><button className="button secondary" type="button" onClick={refresh}>Reintentar carga de empresa</button></div>:null
      )}
      {tab==="perfil" && <section className="live-card"><h2>{accountType==="business"?"Mis datos personales":"Mis datos de Cliente"}</h2><p className="live-muted">{accountType==="business"?"Estos son tus datos de contacto como propietario. Los datos comerciales se gestionan dentro de Mi negocio.":"Tu nombre, apellidos, correo, teléfono y ciudad se compartirán con el negocio únicamente cuando confirmes una solicitud."}</p>
       <form className="live-form live-columns" onSubmit={saveProfile}>
        <label>Nombre<input required value={profile.first_name} onChange={e=>setProfile(x=>({...x,first_name:e.target.value}))} maxLength={80}/></label>
        <label>Apellidos<input required value={profile.last_name} onChange={e=>setProfile(x=>({...x,last_name:e.target.value}))} maxLength={100}/></label>
        <label>Teléfono de contacto<input type="tel" value={profile.phone} onChange={e=>setProfile(x=>({...x,phone:e.target.value}))} maxLength={40}/></label>
        <label>Ciudad<input value={profile.city} onChange={e=>setProfile(x=>({...x,city:e.target.value}))} maxLength={100}/></label>
        <button className="button primary" disabled={busy}>Guardar mis datos</button>
       </form><p className="live-muted">Email verificado en tu cuenta: {session.user.email}. Los datos fiscales se solicitarán cuando haya facturación real.</p>
      </section>}
      {accountType==="business" && tab==="inicio" && <BusinessHome
         organization={business||null}
         serviceCount={services.length}
         customerCount={contacts.length}
         requestCount={ownerRequests.length}
         pendingCount={ownerRequests.filter(r=>r.status==="new").length}
         recentRequests={ownerRequests}
         onNavigate={setTab}
        />}
       {accountType==="business" && tab==="herramientas" && <BusinessTools key={selectedOrg} onNavigate={setTab} organizationId={selectedOrg}/>}
       {accountType==="business" && workboardVisited && <div hidden={tab!=="agenda"&&tab!=="workboard"}>{selectedOrg?<BusinessWorkboard key={selectedOrg} organizationId={selectedOrg} initialKind={tab==="agenda"?"appointment":tab==="workboard"?"project":undefined}/>:<section className="live-card">Primero registra una empresa.</section>}</div>}
       {accountType==="business" && tab==="sedes" && (selectedOrg?<BusinessLocations key={selectedOrg} organizationId={selectedOrg}
         organizationPublished={business?.published??false} publishing={busy}
         onPublishOrganization={business?()=>togglePublish(business):undefined}/>:<section className="live-card"><h2>Registra tu primera empresa</h2><button type="button" className="button primary" onClick={()=>setTab("gestion")}>Crear empresa</button></section>)}
       {accountType==="business" && (tab==="negocio"||profileVisited) && <div hidden={tab!=="negocio"} className="business-profile-workspace">
        <header className="business-profile-heading"><span className="eyebrow">ESCAPARATE PÚBLICO</span><h2>Perfil de {business?.name||"tu negocio"}</h2><p className="live-muted">Edita el perfil comercial que verán tus clientes. Tus datos personales están en Mi cuenta.</p></header>
        <nav className="business-profile-sections" aria-label="Editar perfil público">{([
         ["general","Información general"],["appearance","Diseño y apariencia"],["services","Servicios"],["posts","Publicaciones y portfolio"],["locations","Sedes y contacto"],["visibility","Visibilidad"],["preview","Ver como Cliente"]
        ] as const).map(([id,label])=><button key={id} type="button" aria-current={profileSection===id?"page":undefined} onClick={()=>openProfileSection(id)}>{label}</button>)}</nav>
        {profileSection==="general"&&<section className="live-card business-live-profile"><h3>Información general</h3>
         {business?<form className="live-form live-columns" onSubmit={saveCompany}>
          <label>Nombre comercial<input required minLength={2} maxLength={120} value={companyDraft.name} onChange={e=>setCompanyDraft(v=>({...v,name:e.target.value}))}/></label>
          <label>Sector<input required maxLength={80} value={companyDraft.category} onChange={e=>setCompanyDraft(v=>({...v,category:e.target.value}))}/></label>
          <label>Localidad<input maxLength={100} value={companyDraft.city} onChange={e=>setCompanyDraft(v=>({...v,city:e.target.value}))}/></label>
          <label className="business-live-full">Descripción del negocio<textarea rows={5} maxLength={1200} value={companyDraft.description} onChange={e=>setCompanyDraft(v=>({...v,description:e.target.value}))}/></label>
          <button className="button primary" disabled={busy}>Guardar cambios</button>
         </form>:<button type="button" className="button primary" onClick={()=>setTab("gestion")}>Registrar mi negocio</button>}
        </section>}
        {selectedOrg&&<div hidden={!["appearance","posts"].includes(profileSection)}><BusinessSocialEditor key={selectedOrg} organizationId={selectedOrg}
          organizationPublished={business?.published} onProfileChange={refresh} active={tab==="negocio"&&profileSection==="posts"} section={profileSection==="posts"?"posts":"appearance"}/></div>}
        {profileSection==="services"&&<section className="live-card"><h3>Servicios del perfil</h3><p>Los servicios activos de tu catálogo aparecen en el perfil comercial, respetando la distribución guardada.</p>{services.filter(service=>service.active).map(service=><article className="live-row" key={service.id}><div><strong>{service.title}</strong><p>{service.description}</p></div><span>{money(service.price_eur)}</span></article>)}<button type="button" className="button primary" onClick={()=>setTab("gestion")}>Gestionar servicios</button></section>}
        {profileSection==="locations"&&selectedOrg&&<BusinessLocations key={selectedOrg} organizationId={selectedOrg} organizationPublished={business?.published??false} publishing={busy} onPublishOrganization={business?()=>togglePublish(business):undefined}/>}
        {profileSection==="visibility"&&business&&<section className="live-card business-live-profile"><h3>Visibilidad pública</h3><div className="business-live-publication"><div><strong>{business.published?"Visible en Explorar":"Perfil privado"}</strong><p>La visibilidad pública no afecta a los datos privados de clientes, solicitudes y conversaciones.</p></div><button className="button secondary" type="button" disabled={busy} onClick={()=>togglePublish(business)}>{business.published?"Ocultar negocio":"Publicar negocio"}</button></div></section>}
        {profileSection==="preview"&&business&&<section className="live-card"><h3>Vista como Cliente</h3><p>Abre la misma ficha pública y los mismos datos que consulta Cliente.</p>{business.published?<a className="button primary" href={"/cliente?negocio="+encodeURIComponent(business.id)}>Abrir perfil como Cliente <ArrowRight size={15}/></a>:<><p>El negocio está privado. Publícalo desde Visibilidad cuando quieras compartirlo; no se mostrarán borradores como si fueran públicos.</p><button className="button secondary" type="button" onClick={()=>openProfileSection("visibility")}>Configurar visibilidad</button></>}</section>}
       </div>}
       {accountType==="business" && tab==="clientes" && <section className="live-card">
         <h2>Clientes de {business?.name||"tu negocio"}</h2>
         <p className="live-muted">Contactos reales vinculados a las solicitudes recibidas por este negocio. Los clientes de otras empresas permanecen privados.</p>
         {contacts.length===0?<div className="business-live-empty"><UsersRound size={25}/><strong>Todavía no hay clientes vinculados</strong><p>Aparecerán aquí automáticamente cuando una cuenta Cliente solicite uno de tus servicios.</p></div>:contacts.map(c=><article className="business-live-contact" key={c.customer_id}>
            <div className="business-live-contact-avatar">{c.display_name.slice(0,1).toUpperCase()}</div>
            <div><strong>{c.display_name}</strong><p>{c.email}</p><p>{c.phone||"Sin teléfono"} · {c.city||"Sin localidad"}</p></div>
         </article>)}
       </section>}
       {accountType==="business" && tab==="solicitudes-empresa" && <section className="live-card">
         <h2>Solicitudes recibidas</h2>
         <p className="live-muted">Solicitudes reales de {business?.name||"tu negocio"}. Puedes actualizar su estado y el cliente lo verá en su cuenta.</p>
         {ownerRequests.length===0?<div className="business-live-empty"><ClipboardList size={25}/><strong>Aún no hay solicitudes</strong><p>Cuando un cliente solicite un servicio, lo verás aquí.</p></div>:ownerRequests.map(r=><div key={r.id} className="live-row">
            <div><strong>{r.customer_name}</strong><p>{r.notes||"Sin comentarios"}</p><small>{r.requested_date||"Fecha sin concretar"}</small></div>
            <select aria-label={"Cambiar estado de solicitud de "+r.customer_name} value={r.status} disabled={busy} onChange={e=>changeStatus(r,e.target.value)}>
               <option value="new">Nueva</option><option value="accepted">Aceptada</option><option value="rejected">Rechazada</option><option value="completed">Completada</option>
            </select>
          </div>)}
       </section>}
       {accountType==="business" && messagesVisited && session && <div hidden={tab!=="mensajes"}><SocialInbox active={tab==="mensajes"} key={selectedOrg} userId={session.user.id} role="business" organizations={business?[{id:business.id,name:business.name}]:[]}/></div>}
       {accountType==="business" && tab==="gestion" && <div className="live-grid">
       <section className="live-card"><h2>Mis negocios</h2>
        {orgs.length ? <>
        {business && <div className="live-manage"><p><strong>{business.name}</strong> · {business.city || "Sin ciudad"}</p><p>{business.published?"Visible en Explorar":"Perfil privado"}</p>
        <button className="button secondary" disabled={busy} onClick={()=>togglePublish(business)}>{business.published?"Ocultar del directorio":"Publicar negocio"}</button></div>}
        <h3>Añadir servicio</h3><form className="live-form" onSubmit={addService}>
        <label>Servicio<input value={serviceName} onChange={e=>setServiceName(e.target.value)} required maxLength={120} placeholder="Ej. Sesión de fotografía"/></label>
        <label>Precio (€) — opcional<input type="number" min="0" step="0.01" value={servicePrice} onChange={e=>setServicePrice(e.target.value)} placeholder="Consultar"/></label>
        <button className="button primary" disabled={busy||!contextReady}>Guardar servicio</button></form>
        {services.map(s=><div key={s.id} className="live-row"><strong>{s.title}</strong><span>{money(s.price_eur)}</span></div>)}</> : <p className="live-muted">Todavía no tienes negocios registrados.</p>}
        {orgs.length===0&&<details className="business-live-add-another" open><summary>Registrar mi primera empresa</summary><form className="live-form" onSubmit={addOrg}>
        <label>Nombre comercial<input value={businessName} onChange={e=>setBusinessName(e.target.value)} required minLength={2} maxLength={120}/></label>
        <label>Sector<input value={businessCategory} onChange={e=>setBusinessCategory(e.target.value)} maxLength={80} required/></label>
        <label>Ciudad<input value={businessCity} onChange={e=>setBusinessCity(e.target.value)} maxLength={100}/></label>
        <button className="button primary" disabled={busy}>Crear empresa</button></form></details>}
        {orgs.length>0&&<button type="button" className="button secondary" onClick={()=>setTab("sedes")}>+ Añadir otra tienda o sede</button>}
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
   <p className="live-disclaimer">Tus clientes, servicios y solicitudes se guardan en tu cuenta. Los pagos, la facturación y las reservas automáticas todavía no están disponibles.</p>
 </div>;
 if (accountType==="customer" && pathname==="/cliente" && session && accountRole==="customer") {
   return <CustomerSocial userId={session.user.id} email={session.user.email||""} onLogout={logout}/>;
 }
  if (accountType==="business" && pathname==="/empresa" && session && accountRole==="business") {
   const primary=businessPrimarySection(tab);
   const sectionLabels:Record<string,string>={inicio:"Panel general",agenda:"Agenda",workboard:"Proyectos y agenda",mensajes:"Mensajes","gestion-hub":"Gestión",gestion:"Servicios",clientes:"Clientes y CRM","solicitudes-empresa":"Solicitudes",sedes:"Tiendas y sedes",herramientas:"Herramientas",negocio:"Perfil público",perfil:"Mi cuenta"};
   const primaryNavigate=(id:string)=>setTab(id==="agenda"?"agenda":id==="gestion"?"gestion-hub":id==="perfil"?"negocio":id as BusinessArea);
   return <div className="workspace-shell live-integrated-shell app-has-bottom-nav">
    <a className="skip-link" href="#business-main-content">Saltar al contenido</a>
    <aside className="workspace-sidebar" aria-label="Navegación de Empresa"><div className="workspace-logo"><Brand/></div><DesktopBusinessNavigation active={tab==="agenda"?"workboard":tab} onNavigate={area=>setTab(area as BusinessArea)}/><div className="live-sidebar-bottom"><Link className="workspace-nav-item" href="/"><ArrowLeft size={18}/> Página inicial</Link></div></aside>
    <div className="workspace-body live-workspace-body">
     <header className="workspace-topbar live-workspace-topbar">
      <div className="business-header-identity"><div className="business-header-mobile-brand"><Brand/></div>{orgs.length>1?<label className="business-active-company">Empresa activa<select aria-label="Cambiar de empresa activa" value={selectedOrg} disabled={busy} onChange={e=>setSelectedOrg(e.target.value)}>{orgs.map(org=><option key={org.id} value={org.id}>{org.name}</option>)}</select></label>:<strong>{business?.name||"AutonoService"}</strong>}<span className="business-current-section">{sectionLabels[tab]||"Empresa"}</span></div>
      <AccountActions experience="business" onLogout={logout} onRefresh={refresh} onAccount={()=>setTab("perfil")}/>
     </header>
     <main id="business-main-content" tabIndex={-1}><h1 className="sr-only">{sectionLabels[tab]||"Empresa"}</h1>{content}</main>
    </div>
    <AppBottomNavigation experience="business" active={primary} onNavigate={primaryNavigate}/>
   </div>;
 }
 if (pathname==="/cliente" || pathname==="/empresa") return <><a className="skip-link" href="#main-content">Saltar al contenido</a><main id="main-content" tabIndex={-1}>{content}</main></>;
 return content;
}
