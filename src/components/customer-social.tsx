"use client";

import { useEffect,useMemo,useState,type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
 ArrowRight, CalendarDays, Camera, Check, Compass, Heart, LayoutGrid, MapPin,
 MessageCircle, Search, ShieldCheck, Sparkles, UserRound, RefreshCw,
 Bookmark, Building2, SlidersHorizontal, MapPinned, LogOut, Settings2
} from "lucide-react";
import { getSupabase } from "@/lib/supabase/client";
import { SocialInbox } from "@/components/social-inbox";
import { BusinessMap } from "@/components/business-map";
import "./customer-social.css";

type Organization={id:string;name:string;category:string;city:string;description:string;tagline:string;accent_color:string;avatar_url:string;cover_url:string;published:boolean};
type BusinessPost={id:string;organization_id:string;body:string;media_url:string;media_kind:"image"|"video"|null;created_at:string};
type PublicLocation={id:string;organization_id:string;name:string;city:string;address:string;service_mode:string;availability_mode:string;published:boolean;latitude:number|null;longitude:number|null};
type Service={id:string;organization_id:string;title:string;description:string;price_eur:number|null;active:boolean};
type Request={id:string;organization_id:string;service_id:string;notes:string;requested_date:string|null;status:string;created_at:string};
type Profile={first_name:string;last_name:string;phone:string;city:string};
type Tab="explorar"|"mapa"|"novedades"|"actividad"|"favoritos"|"mensajes"|"perfil";
const formatMoney=(n:number|null)=>n===null?"Consultar precio":
 new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR"}).format(n);
const categories=["Todos","Fotografía","Belleza","Gastronomía","Hogar","Otros"];
const categoryTheme=(str:string)=>{
 const q=str.toLowerCase();
 return /foto|video|vídeo|creativ|diseño/.test(q)?"creative":
        /belleza|peluq|barber|estética/.test(q)?"beauty":
        /restau|comida|pasteler|panad/.test(q)?"food":"general";
};
const categoryMatches=(category:string,choice:string):boolean=>{
 const s=category.toLowerCase();
 return choice==="Todos"||
 (choice==="Fotografía"&&/fot|vide|creativ|diseñ/.test(s))||
 (choice==="Belleza"&&/belle|peluq|barb|estéti/.test(s))||
 (choice==="Gastronomía"&&/restau|comid|pastel|panad|gastron/.test(s))||
 (choice==="Hogar"&&/hogar|repar|limp|jardin|fontan|reform/.test(s))||
 (choice==="Otros"&&!categories.slice(1,-1).some(c=>categoryMatches(category,c)));
};
export function CustomerSocial({userId,email,onLogout}:{userId:string;email:string;onLogout:()=>void}){
 const db=getSupabase();
 const router=useRouter();
 const [tab,setTab]=useState<Tab>("explorar");
 const [organizations,setOrganizations]=useState<Organization[]>([]);
 const [directoryLoading,setDirectoryLoading]=useState(true);
 const [services,setServices]=useState<Service[]>([]);
 const [posts,setPosts]=useState<BusinessPost[]>([]);
 const [locations,setLocations]=useState<PublicLocation[]>([]);
 const [requests,setRequests]=useState<Request[]>([]);
 const [favorites,setFavorites]=useState<string[]>([]);
 const [profile,setProfile]=useState<Profile>({first_name:"",last_name:"",phone:"",city:""});
 const [category,setCategory]=useState("Todos");
 const [query,setQuery]=useState("");
 const [city,setCity]=useState("");
 const [detail,setDetail]=useState<string|null>(null);
 // Static Cloudflare export: the complete company profile is a client-side
 // view addressed by /cliente?negocio=<uuid>, not a demo-only dynamic route.
 useEffect(()=>{
   const sync=()=>{
     const value=new URLSearchParams(window.location.search).get("negocio");
     setDetail(value&&/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value)?value:null);
   };
   sync();
   window.addEventListener("popstate",sync);
   return ()=>window.removeEventListener("popstate",sync);
 },[]);
 function openBusinessProfile(id:string){
   setDetail(id);setChosenService(null);
   const url=new URL(window.location.href);
   url.searchParams.set("negocio",id);
   window.history.pushState(null,"",url);
 }
 function closeBusinessProfile(){
   setDetail(null);setChosenService(null);
   const url=new URL(window.location.href);
   url.searchParams.delete("negocio");
   window.history.pushState(null,"",url);
 }
 function selectTab(next:Tab){
   closeBusinessProfile();setTab(next);
 }
 const [targetChatOrg,setTargetChatOrg]=useState<string|null>(null);
 const [chosenService,setChosenService]=useState<string|null>(null);
 const [requestDate,setRequestDate]=useState("");
 const [requestNotes,setRequestNotes]=useState("");
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState("");
 const [reload,setReload]=useState(0);
 useEffect(()=>{
   // An editor in another browser may publish or change the cover while this
   // customer session is already open.
   const reloadOnFocus=()=>setReload(n=>n+1);
   window.addEventListener("focus",reloadOnFocus);
   return ()=>window.removeEventListener("focus",reloadOnFocus);
 },[]);
 const refresh=()=>setReload(v=>v+1);
 const displayName=profile.first_name.trim()||email.split("@")[0]||"Hola";
 const initials=(profile.first_name.slice(0,1)+profile.last_name.slice(0,1)).toUpperCase()||"AS";
 const selectedOrganization=organizations.find(o=>o.id===detail);
 const selectedService=services.find(s=>s.id===chosenService);
 const currentServices=services.filter(s=>s.organization_id===selectedOrganization?.id);
 const orgName=(id:string)=>organizations.find(o=>o.id===id)?.name||"Negocio";

 useEffect(()=>{
   if(!db)return;
   let active=true;
   Promise.all([
    db.from("organizations").select("id,name,category,city,description,tagline,accent_color,avatar_url,cover_url,published").eq("published",true).order("name"),
    db.from("organization_services").select("id,organization_id,title,description,price_eur,active").eq("active",true),
    db.from("service_requests").select("id,organization_id,service_id,notes,requested_date,status,created_at")
      .eq("customer_id",userId).order("created_at",{ascending:false}),
    db.from("customer_favorites").select("organization_id").eq("customer_id",userId),
    db.from("person_profiles").select("first_name,last_name,phone,city").eq("user_id",userId).maybeSingle(),
    db.from("business_posts").select("id,organization_id,body,media_url,media_kind,created_at").eq("published",true).order("created_at",{ascending:false}).limit(120),
    db.from("organization_locations").select("id,organization_id,name,city,address,service_mode,availability_mode,published,latitude,longitude").eq("published",true)
   ]).then(([o,s,r,f,p,postResult,locationResult])=>{
     if(!active)return;
     setDirectoryLoading(false);
     const error=o.error||s.error||r.error||f.error||p.error||postResult.error||locationResult.error;
     if(o.error){
       setNotice("No se ha podido cargar el directorio: "+o.error.message);
     }else{
       setOrganizations((o.data||[]) as Organization[]);
     }
     const secondaryErrors=[s.error,r.error,f.error,p.error,postResult.error,locationResult.error].filter(Boolean);
     if(secondaryErrors.length)setNotice("Alguna función secundaria no pudo cargarse: "+secondaryErrors.map(e=>e!.message).join("; "));

     if(!s.error)setServices((s.data||[]) as Service[]);
     if(!postResult.error)setPosts((postResult.data||[]) as BusinessPost[]);
     if(!locationResult.error)setLocations((locationResult.data||[]) as PublicLocation[]);
     if(!r.error)setRequests((r.data||[]) as Request[]);
     if(!f.error)setFavorites((f.data||[]).map(x=>x.organization_id as string));
     if(!p.error&&p.data)setProfile(p.data as Profile);
   });
   return ()=>{active=false;};
 },[db,userId,reload]);

 const listed=useMemo(()=>organizations.filter(o=>{
   const q=query.toLocaleLowerCase("es").trim();
   return categoryMatches(o.category,category)
     &&(!city.trim()||o.city.toLowerCase().includes(city.toLowerCase().trim()))
     &&(!q||[o.name,o.category,o.city,o.description,...services.filter(s=>s.organization_id===o.id).map(s=>s.title)]
        .join(" ").toLocaleLowerCase("es").includes(q));
 }),[organizations,category,city,query,services]);
 const favoriteOrgs=organizations.filter(o=>favorites.includes(o.id));

 async function operation(fn:()=>Promise<void>){
   setBusy(true);setNotice("");
   try{await fn();}catch(e){setNotice(e instanceof Error?e.message:"Ha ocurrido un error.");}
   finally{setBusy(false);}
 }
 function toggleFavorite(organizationId:string){
   if(!db)return;
   void operation(async()=>{
     if(favorites.includes(organizationId)){
       const {error}=await db.from("customer_favorites").delete().eq("customer_id",userId).eq("organization_id",organizationId);
       if(error)throw error;
       setFavorites(old=>old.filter(x=>x!==organizationId));
     }else{
       const {error}=await db.from("customer_favorites").insert({customer_id:userId,organization_id:organizationId});
       if(error)throw error;
       setFavorites(old=>[...old,organizationId]);
     }
   });
 }
 function saveProfile(e:FormEvent){
   e.preventDefault();if(!db)return;
   void operation(async()=>{
     if(!profile.first_name.trim()||!profile.last_name.trim())throw Error("Indica tu nombre y apellidos.");
     const {error}=await db.from("person_profiles").update(profile).eq("user_id",userId);
     if(error)throw error;
     setNotice("Perfil actualizado. Estos datos son los mismos que verás en el área Empresa.");
   });
 }
 function sendRequest(e:FormEvent){
   e.preventDefault();if(!db||!selectedOrganization||!selectedService)return;
   void operation(async()=>{
     if(!profile.first_name.trim())throw Error("Completa antes el nombre de tu perfil.");
     const {error}=await db.from("service_requests").insert({
       organization_id:selectedOrganization.id,service_id:selectedService.id,customer_id:userId,
       notes:requestNotes.trim(),requested_date:requestDate||null
     });
     if(error)throw error;
     setChosenService(null);closeBusinessProfile();setRequestNotes("");setRequestDate("");
     setTab("actividad");refresh();
     setNotice("Solicitud enviada. El negocio podrá consultarla desde su área Empresa.");
   });
 }
 function openMessages(id:string){
   setTargetChatOrg(id);closeBusinessProfile();setTab("mensajes");
 }
 const nav=[
  {id:"explorar" as Tab,label:"Explorar",Icon:Compass},
  {id:"mapa" as Tab,label:"Mapa",Icon:MapPinned},
  {id:"novedades" as Tab,label:"Novedades",Icon:Sparkles},
  {id:"actividad" as Tab,label:"Mi actividad",Icon:CalendarDays},
  {id:"favoritos" as Tab,label:"Favoritos",Icon:Heart},
  {id:"mensajes" as Tab,label:"Mensajes",Icon:MessageCircle},
  {id:"perfil" as Tab,label:"Mi perfil",Icon:UserRound},
 ];
 const BusinessCard=({org}:{org:Organization})=>{
  const offers=services.filter(s=>s.organization_id===org.id);
  const followed=favorites.includes(org.id);
  return <article className="as-social-business-card">
     <button type="button" className={`as-social-business-art ${categoryTheme(org.category)}`}
      onClick={()=>openBusinessProfile(org.id)} aria-label={"Ver negocio "+org.name}>
      <span className="as-social-art-label">{org.category}</span>
      {org.cover_url?<img className="as-social-cover-image" src={org.cover_url} alt={"Portada de "+org.name}/>:<span className="as-social-art-monogram">{org.name.slice(0,1).toUpperCase()}</span>}
      <span className="as-social-art-end"><MapPin size={13}/>{org.city||"Servicio sin localidad"}</span>
     </button>
     <div className="as-social-business-body">
      <div className="as-social-business-top"><span className="as-social-type">NEGOCIO INSCRITO</span>
       <button type="button" className={followed?"as-social-heart is-saved":"as-social-heart"}
         disabled={busy} aria-label={followed?"Quitar de favoritos":"Guardar en favoritos"} onClick={()=>toggleFavorite(org.id)}>
         <Heart size={19} fill={followed?"currentColor":"none"}/>
       </button>
      </div>
      <h3>{org.avatar_url&&<img className="as-social-mini-avatar" src={org.avatar_url} alt=""/>}{org.name}</h3>
      <p>{org.tagline||org.description||"Descubre los servicios que ofrece este negocio."}</p>
      <div className="as-social-tags">{offers.slice(0,3).map(s=><span key={s.id}>{s.title}</span>)}</div>
      <div className="as-social-business-actions">
       <button className="button primary small" type="button" onClick={()=>openBusinessProfile(org.id)}>Ver perfil <ArrowRight size={14}/></button>
       <button className="button secondary small" type="button" onClick={()=>openMessages(org.id)}><MessageCircle size={14}/> Mensaje</button>
      </div>
     </div>
   </article>;
 };

 return <div className="as-social-client">
    <div className="as-social-client-top">
      <div className="as-social-client-identity"><span className="as-social-client-avatar">{initials}</span>
        <div><strong>{displayName}</strong><small>Tu espacio personal · Gratis</small></div></div>
      <div className="as-social-client-tools">
        <button className="as-social-utility" onClick={refresh} aria-label="Actualizar datos" title="Actualizar datos"><RefreshCw size={18}/></button>
        <button className="as-social-utility" onClick={()=>router.push("/empresa")} aria-label="Ir a mi espacio Empresa" title="Cambiar al espacio Empresa"><Building2 size={18}/></button>
        <button className="as-social-utility" onClick={onLogout} aria-label="Cerrar sesión" title="Cerrar sesión"><LogOut size={18}/></button>
      </div>
    </div>
    <nav className="as-social-client-tabs" aria-label="Navegación Cliente">
      {nav.map(({id,label,Icon})=><button key={id} type="button" onClick={()=>selectTab(id)} className={tab===id?"is-active":""}>
        <Icon size={17}/><span>{label}</span>
      </button>)}
    </nav>
    {!detail&&<main className="as-social-client-content">
    {tab==="explorar" && <>
      <section className="as-social-hero">
        <div><span className="eyebrow"><Sparkles size={12}/> TU CIUDAD, TUS SERVICIOS</span>
          <h1>Encuentra lo que necesitas.<br/><em>Cerca de ti.</em></h1>
          <p>Descubre profesionales y negocios, guarda tus favoritos y habla con ellos desde AutonoService.</p>
          <div className="as-social-hero-search"><Search size={19}/>
           <input aria-label="Buscar negocios o servicios" placeholder="Buscar negocio, servicio, sector…" value={query} onChange={e=>setQuery(e.target.value)}/>
          </div>
        </div>
        <div className="as-social-hero-decoration" aria-hidden="true"><MapPinned size={85}/><span>DESCUBRE</span><i/></div>
      </section>
      <section className="as-social-discovery-heading">
        <div><span className="eyebrow">EXPLORAR</span><h2>Negocios para descubrir</h2><p>Perfiles reales publicados por empresas inscritas.</p></div>
        <label className="as-social-city-filter"><MapPin size={15}/>
         <input placeholder="Filtrar localidad" aria-label="Filtrar por localidad" value={city} onChange={e=>setCity(e.target.value)}/></label>
      </section>
      <div className="as-social-category-scroll" aria-label="Filtrar por categoría">
        {categories.map(c=><button type="button" key={c} className={category===c?"is-active":""} onClick={()=>setCategory(c)}>{c}</button>)}
      </div>
      <div className="as-social-business-grid">
        {listed.map(o=><BusinessCard key={o.id} org={o}/>)}
      </div>
      {listed.length===0&&<div className="as-social-empty-large"><SlidersHorizontal size={23}/><h3>No hemos encontrado negocios con esos filtros</h3><p>Prueba otro sector, servicio o localidad.</p></div>}
      <div className="as-social-map-preview"><MapPinned size={20}/><div><strong>Mapa de tiendas y servicios</strong><p>Explora únicamente sedes que hayan publicado su ubicación exacta.</p><button className="button secondary small" type="button" onClick={()=>setTab("mapa")}>Abrir mapa interactivo <ArrowRight size={14}/></button></div></div>
    </>}
    {tab==="mapa"&&<>
  <div className="as-social-section-title"><span className="eyebrow">NEGOCIOS CERCA DE TI</span><h1>Explora tiendas en el mapa.</h1>
    <p>Solo aparecen ubicaciones que sus propietarios han colocado y publicado expresamente. No inferimos direcciones ni mostramos pines ficticios.</p>
  </div>
  <BusinessMap height={470} points={locations
    .filter(l=>l.latitude!==null&&l.longitude!==null&&organizations.some(o=>o.id===l.organization_id))
    .map(l=>({id:l.organization_id,name:orgName(l.organization_id)+" · "+l.name,latitude:l.latitude as number,longitude:l.longitude as number}))}
    onSelect={id=>openBusinessProfile(id)}/>
  <p className="live-muted">Utiliza el buscador de Explorar si un negocio no ha publicado su ubicación. El mapa no solicita tu ubicación personal.</p>
 </>}
 {tab==="novedades"&&<>
  <div className="as-social-section-title"><span className="eyebrow">COMUNIDAD</span>
   <h1>Novedades de tus negocios</h1>
   <p>Publicaciones auténticas de las empresas que has guardado como favoritas.</p></div>
  {posts.filter(p=>favorites.includes(p.organization_id)).length===0
    ?<div className="as-social-empty-large"><Sparkles size={26}/><h3>Todavía no tienes novedades</h3><p>Guarda un negocio en favoritos y verás sus publicaciones aquí.</p>
      <button className="button primary" type="button" onClick={()=>setTab("explorar")}>Descubrir negocios</button></div>
    :<div className="as-social-news-feed">{posts.filter(p=>favorites.includes(p.organization_id)).map(post=><article key={post.id} className="as-social-news-post">
      <button type="button" className="as-social-news-author" onClick={()=>openBusinessProfile(post.organization_id)}>
       {organizations.find(o=>o.id===post.organization_id)?.avatar_url
         ?<img src={organizations.find(o=>o.id===post.organization_id)?.avatar_url} alt=""/>
         :<span>{orgName(post.organization_id).slice(0,1)}</span>}
       <strong>{orgName(post.organization_id)}</strong><small>{new Date(post.created_at).toLocaleDateString("es-ES")}</small>
      </button>
      {post.body&&<p>{post.body}</p>}
      {post.media_url&&post.media_kind==="image"&&<img className="as-social-news-media" src={post.media_url} alt={"Publicación de "+orgName(post.organization_id)}/>}
      {post.media_url&&post.media_kind==="video"&&<video className="as-social-news-media" controls preload="metadata" src={post.media_url}/>}
      <button type="button" className="button secondary small" onClick={()=>openMessages(post.organization_id)}><MessageCircle size={14}/> Contactar con el negocio</button>
    </article>)}</div>}
  </>}
  {tab==="actividad"&&<>
      <div className="as-social-section-title"><span className="eyebrow">TU ACTIVIDAD</span><h1>Todo lo que contratas, en un lugar.</h1><p>Solicitudes enviadas desde tu identidad Cliente a diferentes negocios.</p></div>
      <div className="as-social-mini-stats">
        <div><CalendarDays size={20}/><strong>{requests.length}</strong><span>Solicitudes</span></div>
        <div><Check size={20}/><strong>{requests.filter(r=>r.status==="accepted"||r.status==="completed").length}</strong><span>Aceptadas o completadas</span></div>
        <div><Bookmark size={20}/><strong>{favorites.length}</strong><span>Negocios guardados</span></div>
      </div>
      {requests.length===0?<div className="as-social-empty-large"><CalendarDays size={27}/><h3>Tu actividad empieza aquí</h3><p>Explora un negocio y solicita uno de sus servicios. Verás su estado en esta sección.</p><button className="button primary" type="button" onClick={()=>setTab("explorar")}>Explorar negocios <ArrowRight size={15}/></button></div>
      :<div className="as-social-activity-list">{requests.map(r=><article key={r.id} className="as-social-activity-row">
        <span className="as-social-activity-icon"><CalendarDays size={22}/></span>
        <div><small>{orgName(r.organization_id)}</small><strong>{services.find(s=>s.id===r.service_id)?.title||"Solicitud de servicio"}</strong>
          <p>{r.notes||"Sin comentarios"}{r.requested_date?" · Fecha deseada: "+r.requested_date:""}</p></div>
        <span className={"as-social-request-state "+r.status}>{({new:"Pendiente",accepted:"Aceptada",rejected:"Rechazada",completed:"Completada"} as Record<string,string>)[r.status]||r.status}</span>
      </article>)}</div>}
    </>}
    {tab==="favoritos"&&<>
      <div className="as-social-section-title"><span className="eyebrow">TUS FAVORITOS</span><h1>Los negocios que te gustan.</h1><p>Guárdalos y encuéntralos siempre desde tu cuenta, incluso si cambias de dispositivo.</p></div>
      {favoriteOrgs.length?<div className="as-social-business-grid">{favoriteOrgs.map(o=><BusinessCard key={o.id} org={o}/>)}</div>
       :<div className="as-social-empty-large"><Heart size={27}/><h3>Todavía no has guardado negocios</h3><p>Marca el corazón en cualquier negocio para añadirlo a favoritos.</p><button type="button" className="button primary" onClick={()=>setTab("explorar")}>Descubrir negocios</button></div>}
    </>}
    {tab==="mensajes"&&<SocialInbox userId={userId} role="customer" organizations={organizations}
      targetOrganizationId={targetChatOrg}/>}
    {tab==="perfil"&&<>
      <div className="as-social-section-title"><span className="eyebrow">MI IDENTIDAD</span><h1>Tu perfil, a tu manera.</h1><p>Una sola identidad para tus espacios Empresa y Cliente. Cada negocio mantiene aparte su propia ficha comercial.</p></div>
      <div className="as-social-profile-grid"><div className="as-social-profile-card">
        <div className="as-social-profile-avatar">{initials}</div>
        <h2>{[profile.first_name,profile.last_name].filter(Boolean).join(" ")||"Tu nombre"}</h2>
        <p>{email}</p><span><ShieldCheck size={14}/> Información privada</span>
        <div className="as-social-profile-stats"><strong>{favorites.length}<small>Favoritos</small></strong><strong>{requests.length}<small>Solicitudes</small></strong></div>
      </div>
      <form className="as-social-profile-form" onSubmit={saveProfile}>
        <h2>Datos personales</h2><p>Se comparten con un negocio únicamente cuando confirmas una solicitud de servicio.</p>
        <div className="as-social-two-fields">
          <label>Nombre<input required maxLength={80} value={profile.first_name} onChange={e=>setProfile(p=>({...p,first_name:e.target.value}))}/></label>
          <label>Apellidos<input required maxLength={100} value={profile.last_name} onChange={e=>setProfile(p=>({...p,last_name:e.target.value}))}/></label>
          <label>Teléfono<input type="tel" maxLength={40} value={profile.phone} onChange={e=>setProfile(p=>({...p,phone:e.target.value}))}/></label>
          <label>Localidad<input maxLength={100} value={profile.city} onChange={e=>setProfile(p=>({...p,city:e.target.value}))}/></label>
        </div>
        <button type="submit" disabled={busy} className="button primary"><Settings2 size={15}/> Guardar perfil</button>
      </form></div>
    </>}
    </main>}
    {detail&&directoryLoading&&<section className="as-social-empty-large" role="status">
      <h2>Cargando perfil de empresa…</h2><p>Consultando los datos publicados del negocio.</p>
    </section>}
    {detail&&!directoryLoading&&!selectedOrganization&&<section className="as-social-empty-large">
       <h2>Este perfil no está disponible públicamente</h2>
       <p>Puede que el negocio todavía sea privado o se haya retirado del directorio. Para ver la portada y los servicios, su propietario debe publicar el perfil.</p>
       <button type="button" className="button primary" onClick={closeBusinessProfile}>Volver a Explorar</button>
     </section>}
    {detail&&selectedOrganization&&<div className="as-social-full-profile">
      <div className="as-social-profile-back">
        <button type="button" className="button secondary" onClick={closeBusinessProfile}>← Volver a Explorar</button>
        <span>Perfil público completo</span>
      </div>
      <section className="as-social-public-profile" aria-label={"Perfil de "+selectedOrganization.name}>

        <div className={`as-social-profile-cover ${categoryTheme(selectedOrganization.category)}`} style={{backgroundColor:selectedOrganization.cover_url?undefined:selectedOrganization.accent_color}}>
          <span>{selectedOrganization.category}</span>{selectedOrganization.cover_url?<img className="as-social-public-cover-image" src={selectedOrganization.cover_url} alt={"Portada de "+selectedOrganization.name}/>:<strong>{selectedOrganization.name.slice(0,1).toUpperCase()}</strong>}
        </div>
        <div className="as-social-public-body">
          <span className="eyebrow">PERFIL COMERCIAL</span>
          <h2>{selectedOrganization.avatar_url&&<img className="as-social-public-avatar" src={selectedOrganization.avatar_url} alt=""/>}{selectedOrganization.name}</h2>{selectedOrganization.tagline&&<p className="as-social-business-tagline">{selectedOrganization.tagline}</p>}
          <p className="as-social-location"><MapPin size={15}/>{selectedOrganization.city||"Localidad no indicada"}</p>
          <p>{selectedOrganization.description||"Este negocio todavía no ha añadido su presentación."}</p>
          <div className="as-social-profile-share">
            <button type="button" className="button secondary small" onClick={()=>{
              const url=new URL(window.location.href);
              url.searchParams.set("negocio",selectedOrganization.id);
              void navigator.clipboard?.writeText(url.toString())
                .then(()=>setNotice("Enlace de perfil copiado."))
                .catch(()=>setNotice("No se pudo copiar el enlace en este navegador."));
            }}>Compartir perfil</button>
          </div>
          <div className="as-social-business-actions">
           <button type="button" className="button secondary" onClick={()=>toggleFavorite(selectedOrganization.id)}>
            <Heart size={15} fill={favorites.includes(selectedOrganization.id)?"currentColor":"none"}/>{favorites.includes(selectedOrganization.id)?"Guardado":"Guardar"}
           </button>
           <button type="button" className="button primary" onClick={()=>openMessages(selectedOrganization.id)}><MessageCircle size={15}/> Enviar mensaje</button>
          </div>
          {locations.filter(l=>l.organization_id===selectedOrganization.id).length>0&&<section className="as-social-public-locations">
            <h3>Tiendas y sedes</h3>
            {locations.filter(l=>l.organization_id===selectedOrganization.id).map(l=><div key={l.id} className="as-social-public-location">
              <div><strong>{l.name}</strong><p>{[l.address,l.city].filter(Boolean).join(" · ")||"Ubicación por concretar"} · {l.availability_mode==="cita"?"Con cita previa":"Consultar disponibilidad"}</p></div>
              {(l.address||l.city)&&<a className="button secondary small" target="_blank" rel="noopener noreferrer"
               href={"https://www.openstreetmap.org/search?query="+encodeURIComponent([l.address,l.city].filter(Boolean).join(", "))}>Ver mapa</a>}
            </div>)}
          </section>}
          {posts.filter(p=>p.organization_id===selectedOrganization.id).length>0&&<section className="as-social-public-posts">
            <h3>Publicaciones</h3>
            {posts.filter(p=>p.organization_id===selectedOrganization.id).slice(0,8).map(post=><article key={post.id} className="as-social-news-post">
              <small>{new Date(post.created_at).toLocaleDateString("es-ES")}</small>
              {post.body&&<p>{post.body}</p>}
              {post.media_url&&post.media_kind==="image"&&<img className="as-social-news-media" src={post.media_url} alt="Foto publicada por el negocio"/>}
              {post.media_url&&post.media_kind==="video"&&<video className="as-social-news-media" controls preload="metadata" src={post.media_url}/>}
            </article>)}
          </section>}
          <h3>Servicios disponibles</h3>
          {currentServices.length===0?<p>Este negocio todavía no tiene servicios publicados.</p>:
           currentServices.map(s=><div key={s.id} className="as-social-service-row">
             <div><strong>{s.title}</strong>{s.description&&<p>{s.description}</p>}<small>{formatMoney(s.price_eur)}</small></div>
             <button type="button" className="button secondary small" onClick={()=>setChosenService(s.id)}>Solicitar <ArrowRight size={13}/></button>
           </div>)}
          {chosenService&&<form className="as-social-request-form" onSubmit={sendRequest}>
            <h3>Solicitar {selectedService?.title}</h3>
            <label>Fecha deseada (opcional)<input type="date" value={requestDate} onChange={e=>setRequestDate(e.target.value)}/></label>
            <label>Cuéntanos qué necesitas<textarea rows={3} maxLength={2000} value={requestNotes} onChange={e=>setRequestNotes(e.target.value)}/></label>
            <p>Al enviar, se compartirán los datos de contacto de tu perfil con este negocio para gestionar el servicio.</p>
            <button type="submit" className="button primary" disabled={busy}>Confirmar solicitud <ArrowRight size={15}/></button>
          </form>}
        </div>
      </section>
    </div>}
    {notice&&<div className="as-social-notice" role="status">{notice}<button type="button" onClick={()=>setNotice("")} aria-label="Cerrar mensaje">×</button></div>}
    <footer className="as-social-footer"><ShieldCheck size={14}/> Los negocios, servicios, mensajes, favoritos y publicaciones son reales. Las reservas automáticas todavía están en desarrollo. El mapa muestra únicamente sedes con coordenadas verificadas por sus propietarios.</footer>
  </div>;
}
