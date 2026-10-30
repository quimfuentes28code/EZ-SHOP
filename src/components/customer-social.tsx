"use client";

import { useEffect,useMemo,useState,type FormEvent } from "react";
import {
 ArrowRight, CalendarDays, Camera, Check, Compass, Heart, LayoutGrid, MapPin,
 MessageCircle, Search, ShieldCheck, Sparkles, UserRound, RefreshCw,
 Bookmark, SlidersHorizontal, MapPinned, LogOut, Settings2, Building2
} from "lucide-react";
import { getSupabase } from "@/lib/supabase/client";
import { BusinessVideo } from "@/components/business-video";
import { SocialInbox } from "@/components/social-inbox";
import { BusinessMap } from "@/components/business-map";
import { AccountExperienceSwitcher } from "@/components/account-experience-switcher";
import { Modal } from "@/components/modal";
import { useBusinessMedia } from "@/components/use-business-media";
import { getBusinessMapPoints, hasValidCoordinates, matchesBusinessLocation, matchesBusinessQuery } from "@/lib/business-discovery";
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
 const [tab,setTab]=useState<Tab>("explorar");
 const [organizations,setOrganizations]=useState<Organization[]>([]);
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
 const [targetChatOrg,setTargetChatOrg]=useState<string|null>(null);
 const [chosenService,setChosenService]=useState<string|null>(null);
 const [requestDate,setRequestDate]=useState("");
 const [requestNotes,setRequestNotes]=useState("");
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState("");
 const [reload,setReload]=useState(0);
 const [directoryLoading,setDirectoryLoading]=useState(true);
 const [directoryError,setDirectoryError]=useState("");
 useEffect(()=>{
   const sync=()=>{
     const url=new URL(window.location.href);
     const next=url.searchParams.get("vista");
     setTab(next&&["explorar","mapa","novedades","actividad","favoritos","mensajes","perfil"].includes(next)?next as Tab:"explorar");
     setDetail(url.searchParams.get("negocio"));setChosenService(null);
   };
   sync();window.addEventListener("popstate",sync);
   return ()=>window.removeEventListener("popstate",sync);
 },[]);
 function navigate(next:Tab,businessId:string|null,replace=false){
   const url=new URL(window.location.href);
   if(next==="explorar")url.searchParams.delete("vista");else url.searchParams.set("vista",next);
   if(businessId)url.searchParams.set("negocio",businessId);else url.searchParams.delete("negocio");
   if(url.href!==window.location.href){
     const state={...window.history.state,autonoProfileOrigin:businessId?window.location.href:null};
     if(replace)window.history.replaceState(state,"",url);else window.history.pushState(state,"",url);
   }
   setTab(next);setDetail(businessId);setChosenService(null);
 }
 function openBusinessProfile(id:string){navigate(tab,id);}
 function closeBusinessProfile(){
   if(!detail)return;
   // Only go back when this view was opened inside Cliente. A shared direct
   // link closes in place, without sending the visitor to another website.
   if(window.history.state?.autonoProfileOrigin)window.history.back();
   else navigate(tab,null,true);
 }
 function selectTab(next:Tab){navigate(next,null,Boolean(detail));}
 useEffect(()=>{
   const refreshOnFocus=()=>setReload(v=>v+1);
   window.addEventListener("focus",refreshOnFocus);
   return ()=>window.removeEventListener("focus",refreshOnFocus);
 },[]);
 const refresh=()=>setReload(v=>v+1);
 const mediaUrl=useBusinessMedia([...organizations.flatMap(o=>[o.avatar_url,o.cover_url]),...posts.map(p=>p.media_url)],reload);
 const displayName=profile.first_name.trim()||email.split("@")[0]||"Hola";
 const initials=(profile.first_name.slice(0,1)+profile.last_name.slice(0,1)).toUpperCase()||"AS";
 const selectedOrganization=organizations.find(o=>o.id===detail);
 const selectedService=services.find(s=>s.id===chosenService);
 const currentServices=services.filter(s=>s.organization_id===selectedOrganization?.id);
 const orgName=(id:string)=>organizations.find(o=>o.id===id)?.name||"Negocio";

 useEffect(()=>{
   if(!db){setDirectoryLoading(false);setDirectoryError("No hay conexión con la base de datos.");return;}
   let active=true;
   setDirectoryLoading(true);setDirectoryError("");
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
     if(o.error){setOrganizations([]);setDirectoryError("No se ha podido cargar el directorio: "+o.error.message);}
     else setOrganizations(((o.data||[]) as Organization[]).filter(org=>org.published));
     const secondaryErrors=[s.error,r.error,f.error,p.error,postResult.error,locationResult.error].filter(Boolean);
     if(secondaryErrors.length)setNotice("Algunos datos no se han podido cargar: "+secondaryErrors.map(error=>error!.message).join("; "));
     if(!s.error)setServices(((s.data||[]) as Service[]).filter(service=>service.active));
     if(!postResult.error)setPosts((postResult.data||[]) as BusinessPost[]);
     if(!locationResult.error)setLocations(((locationResult.data||[]) as PublicLocation[]).filter(location=>location.published));
     if(!r.error)setRequests((r.data||[]) as Request[]);
     if(!f.error)setFavorites((f.data||[]).map(x=>x.organization_id as string));
     if(!p.error&&p.data)setProfile(p.data as Profile);
   }).catch(error=>{
     if(active){setDirectoryLoading(false);setOrganizations([]);setDirectoryError(error instanceof Error?error.message:"No se pudo cargar el directorio.");}
   });
   return ()=>{active=false;};
 },[db,userId,reload]);

 const listed=useMemo(()=>organizations.filter(o=>
   categoryMatches(o.category,category)
   && matchesBusinessLocation(o,locations,city)
   && matchesBusinessQuery(o,locations,services.filter(s=>s.organization_id===o.id).map(s=>s.title),query)
 ),[organizations,category,city,query,services,locations]);
 const favoriteOrgs=organizations.filter(o=>favorites.includes(o.id));
 const mapPoints=useMemo(()=>getBusinessMapPoints(listed,locations,city),[listed,locations,city]);

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
     setRequestNotes("");setRequestDate("");
     navigate("actividad",null,true);refresh();
     setNotice("Solicitud enviada. El negocio podrá consultarla desde su área Empresa.");
   });
 }
 function openMessages(id:string){
   setTargetChatOrg(id);selectTab("mensajes");
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
 const renderBusinessCard=(org:Organization)=>{
  const offers=services.filter(s=>s.organization_id===org.id);
  const followed=favorites.includes(org.id);
  return <article key={org.id} className="as-social-business-card">
     <button type="button" className={`as-social-business-art ${categoryTheme(org.category)}`}
      onClick={()=>openBusinessProfile(org.id)} aria-label={"Ver negocio "+org.name}>
      <span className="as-social-art-label">{org.category}</span>
      {mediaUrl(org.cover_url)?<img className="as-social-cover-image" src={mediaUrl(org.cover_url)} alt={"Portada de "+org.name}/>:<span className="as-social-art-monogram">{org.name.slice(0,1).toUpperCase()}</span>}
      <span className="as-social-art-end"><MapPin size={13}/>{[...new Set([org.city,...locations.filter(l=>l.organization_id===org.id&&l.published).map(l=>l.city)])].filter(Boolean).join(" · ")||"Servicio sin localidad"}</span>
     </button>
     <div className="as-social-business-body">
      <div className="as-social-business-top"><span className="as-social-type">NEGOCIO INSCRITO</span>
       <button type="button" className={followed?"as-social-heart is-saved":"as-social-heart"}
         disabled={busy} aria-label={followed?"Quitar de favoritos":"Guardar en favoritos"} onClick={()=>toggleFavorite(org.id)}>
         <Heart size={19} fill={followed?"currentColor":"none"}/>
       </button>
      </div>
      <h3>{mediaUrl(org.avatar_url)&&<img className="as-social-mini-avatar" src={mediaUrl(org.avatar_url)} alt=""/>}{org.name}</h3>
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
        <AccountExperienceSwitcher experience="customer"/>
        <button className="as-social-utility" onClick={onLogout} aria-label="Cerrar sesión" title="Cerrar sesión"><LogOut size={18}/></button>
      </div>
    </div>
    <nav className="as-social-client-tabs" aria-label="Navegación Cliente">
      {nav.map(({id,label,Icon})=><button key={id} type="button" onClick={()=>selectTab(id)} className={tab===id?"is-active":""} aria-current={tab===id?"page":undefined}>
        <Icon size={17}/><span>{label}</span>
      </button>)}
    </nav>
    <div className="as-social-client-content">
    {directoryLoading&&<p role="status">Cargando negocios publicados…</p>}
    {directoryError&&<div role="alert"><p>{directoryError}</p><button className="button secondary" type="button" onClick={refresh}>Reintentar carga</button></div>}
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
        {categories.map(c=><button type="button" key={c} className={category===c?"is-active":""} aria-pressed={category===c} onClick={()=>setCategory(c)}>{c}</button>)}
      </div>
      <div className="as-social-business-grid">
        {listed.map(renderBusinessCard)}
      </div>
      {!directoryLoading&&!directoryError&&listed.length===0&&<div className="as-social-empty-large"><SlidersHorizontal size={23}/><h3>No hemos encontrado negocios con esos filtros</h3><p>Prueba otro sector, servicio o localidad.</p></div>}
      <div className="as-social-map-preview"><MapPinned size={20}/><div><strong>Mapa de tiendas y servicios</strong><p>Explora únicamente sedes que hayan publicado su ubicación exacta.</p><button className="button secondary small" type="button" onClick={()=>selectTab("mapa")}>Abrir mapa interactivo <ArrowRight size={14}/></button></div></div>
    </>}
    {tab==="mapa"&&<>
  <div className="as-social-section-title"><span className="eyebrow">NEGOCIOS CERCA DE TI</span><h1>Explora tiendas en el mapa.</h1>
    <p>Solo aparecen ubicaciones que sus propietarios han colocado y publicado expresamente. No inferimos direcciones ni mostramos pines ficticios.</p>
  </div>
  <div className="as-social-map-filters">
    <label><span>Buscar negocios o servicios</span><input aria-label="Buscar negocios o servicios" value={query} onChange={e=>setQuery(e.target.value)}/></label>
    <label><span>Localidad</span><input aria-label="Filtrar por localidad" value={city} onChange={e=>setCity(e.target.value)}/></label>
  </div>
  <div className="as-social-category-scroll" aria-label="Filtrar por categoría">
    {categories.map(c=><button key={c} type="button" className={category===c?"is-active":""} aria-pressed={category===c} onClick={()=>setCategory(c)}>{c}</button>)}
  </div>
  <BusinessMap height={470} points={mapPoints}
    onSelect={id=>{const point=mapPoints.find(point=>point.id===id);if(point)openBusinessProfile(point.organizationId);}}/>
  <div className="as-social-map-results" aria-label="Sedes del mapa">
    {mapPoints.map(point=><button key={point.id} type="button" className="button secondary small" onClick={()=>openBusinessProfile(point.organizationId)}>Ver perfil de {point.name}</button>)}
  </div>
  <p className="live-muted">Utiliza el buscador de Explorar si un negocio no ha publicado su ubicación. El mapa no solicita tu ubicación personal.</p>
 </>}
 {tab==="novedades"&&<>
  <div className="as-social-section-title"><span className="eyebrow">COMUNIDAD</span>
   <h1>Novedades de tus negocios</h1>
   <p>Publicaciones auténticas de las empresas que has guardado como favoritas.</p></div>
  {posts.filter(p=>favorites.includes(p.organization_id)).length===0
    ?<div className="as-social-empty-large"><Sparkles size={26}/><h3>Todavía no tienes novedades</h3><p>Guarda un negocio en favoritos y verás sus publicaciones aquí.</p>
      <button className="button primary" type="button" onClick={()=>selectTab("explorar")}>Descubrir negocios</button></div>
    :<div className="as-social-news-feed">{posts.filter(p=>favorites.includes(p.organization_id)).map(post=><article key={post.id} className="as-social-news-post">
      <button type="button" className="as-social-news-author" onClick={()=>openBusinessProfile(post.organization_id)}>
       {mediaUrl(organizations.find(o=>o.id===post.organization_id)?.avatar_url)
         ?<img src={mediaUrl(organizations.find(o=>o.id===post.organization_id)?.avatar_url)} alt=""/>
         :<span>{orgName(post.organization_id).slice(0,1)}</span>}
       <strong>{orgName(post.organization_id)}</strong><small>{new Date(post.created_at).toLocaleDateString("es-ES")}</small>
      </button>
      {post.body&&<p>{post.body}</p>}
      {mediaUrl(post.media_url)&&post.media_kind==="image"&&<img className="as-social-news-media" src={mediaUrl(post.media_url)} alt={"Publicación de "+orgName(post.organization_id)}/>}
      {mediaUrl(post.media_url)&&post.media_kind==="video"&&<BusinessVideo className="as-social-news-media" controls preload="metadata" src={mediaUrl(post.media_url)}/>}
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
      {requests.length===0?<div className="as-social-empty-large"><CalendarDays size={27}/><h3>Tu actividad empieza aquí</h3><p>Explora un negocio y solicita uno de sus servicios. Verás su estado en esta sección.</p><button className="button primary" type="button" onClick={()=>selectTab("explorar")}>Explorar negocios <ArrowRight size={15}/></button></div>
      :<div className="as-social-activity-list">{requests.map(r=><article key={r.id} className="as-social-activity-row">
        <span className="as-social-activity-icon"><CalendarDays size={22}/></span>
        <div><small>{orgName(r.organization_id)}</small><strong>{services.find(s=>s.id===r.service_id)?.title||"Solicitud de servicio"}</strong>
          <p>{r.notes||"Sin comentarios"}{r.requested_date?" · Fecha deseada: "+r.requested_date:""}</p></div>
        <span className={"as-social-request-state "+r.status}>{({new:"Pendiente",accepted:"Aceptada",rejected:"Rechazada",completed:"Completada"} as Record<string,string>)[r.status]||r.status}</span>
      </article>)}</div>}
    </>}
    {tab==="favoritos"&&<>
      <div className="as-social-section-title"><span className="eyebrow">TUS FAVORITOS</span><h1>Los negocios que te gustan.</h1><p>Guárdalos y encuéntralos siempre desde tu cuenta, incluso si cambias de dispositivo.</p></div>
      {favoriteOrgs.length?<div className="as-social-business-grid">{favoriteOrgs.map(renderBusinessCard)}</div>
       :<div className="as-social-empty-large"><Heart size={27}/><h3>Todavía no has guardado negocios</h3><p>Marca el corazón en cualquier negocio para añadirlo a favoritos.</p><button type="button" className="button primary" onClick={()=>selectTab("explorar")}>Descubrir negocios</button></div>}
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
    </div>

    {detail&&<Modal title={selectedOrganization?"Perfil de "+selectedOrganization.name:"Perfil comercial"} className="as-social-profile-dialog as-social-company-dialog"
      onClose={closeBusinessProfile}>
      {directoryLoading&&!selectedOrganization?<div role="status"><h3>Cargando perfil de empresa…</h3></div>
        :directoryError?<div role="alert"><p>{directoryError}</p><button className="button secondary" type="button" onClick={refresh}>Reintentar carga</button></div>
        :!selectedOrganization?<section className="as-social-empty-large"><h3>Este perfil no está disponible públicamente</h3><p>El negocio puede ser privado o haberse retirado del directorio.</p><button className="button primary" type="button" onClick={closeBusinessProfile}>Volver al directorio</button></section>
        :<div className="as-company-page">
      <div className="as-company-breadcrumb">
        <button type="button" className="as-company-back" onClick={closeBusinessProfile}><ArrowRight size={16}/> Volver al directorio</button>
        <span>Explorar <span aria-hidden="true">/</span> {selectedOrganization.name}</span>
      </div>

      <section className={"as-company-hero "+categoryTheme(selectedOrganization.category)}
        aria-label={"Portada de "+selectedOrganization.name}
        style={{backgroundColor:selectedOrganization.accent_color||undefined}}>
        <span className="as-company-hero-monogram" aria-hidden="true">{selectedOrganization.name.slice(0,1).toUpperCase()}</span>
        {mediaUrl(selectedOrganization.cover_url)&&<img className="as-company-cover-photo"
          key={mediaUrl(selectedOrganization.cover_url)} src={mediaUrl(selectedOrganization.cover_url)}
          alt={"Portada publicada por "+selectedOrganization.name}
          onError={e=>{e.currentTarget.style.display="none";}}/>}
        <div className="as-company-hero-overlay"/>
        <div className="as-company-hero-caption">
          <span>EMPRESA EN AUTONOSERVICE</span>
          <strong>{selectedOrganization.category}</strong>
        </div>
      </section>

      <header className="as-company-identity">
        <div className="as-company-avatar">
          <span aria-hidden="true">{selectedOrganization.name.slice(0,1).toUpperCase()}</span>
          {mediaUrl(selectedOrganization.avatar_url)&&<img src={mediaUrl(selectedOrganization.avatar_url)}
            alt={"Logo de "+selectedOrganization.name}
            onError={e=>{e.currentTarget.style.display="none";}}/>}
        </div>
        <div className="as-company-identity-copy">
          <h1>{selectedOrganization.name}</h1>
          {selectedOrganization.tagline&&<p className="as-company-tagline">{selectedOrganization.tagline}</p>}
          <div className="as-company-meta"><span><MapPin size={15}/>{selectedOrganization.city||"Ubicación no indicada"}</span>
            <span><Building2 size={15}/>{selectedOrganization.category}</span></div>
        </div>
        <div className="as-company-primary-actions">
          <button type="button" className="button primary" onClick={()=>openMessages(selectedOrganization.id)}>
            <MessageCircle size={17}/> Contactar
          </button>
          <button type="button" className="button secondary" disabled={busy} aria-pressed={favorites.includes(selectedOrganization.id)}
            onClick={()=>toggleFavorite(selectedOrganization.id)}>
            <Heart size={17} fill={favorites.includes(selectedOrganization.id)?"currentColor":"none"}/>
            {favorites.includes(selectedOrganization.id)?"Guardado":"Seguir"}
          </button>
          <button type="button" className="button secondary" onClick={()=>{
            const url=new URL(window.location.href);
            url.searchParams.set("negocio",selectedOrganization.id);
            if(!navigator.clipboard){setNotice("No se puede copiar el enlace en este navegador.");return;}
            void navigator.clipboard.writeText(url.toString())
              .then(()=>setNotice("Enlace del perfil copiado."))
              .catch(()=>setNotice("No se pudo copiar el enlace."));
          }}>Compartir</button>
        </div>
      </header>

      <div className="as-company-page-grid">
        <div className="as-company-page-main">
          <section className="as-company-section" aria-labelledby="company-about">
            <div className="as-company-section-title"><span>01 / PRESENTACIÓN</span><h2 id="company-about">Conoce el negocio</h2></div>
            <p className="as-company-about-text">{selectedOrganization.description||"Este negocio todavía no ha añadido una presentación."}</p>
          </section>

          <section className="as-company-section" aria-labelledby="company-services">
            <div className="as-company-section-title"><span>02 / SERVICIOS</span><h2 id="company-services">Qué podemos hacer por ti</h2></div>
            {currentServices.length===0
              ?<p className="as-company-muted">Este negocio todavía no tiene servicios publicados.</p>
              :<div className="as-company-service-list">{currentServices.map(s=><div key={s.id} className="as-company-service">
                <div><strong>{s.title}</strong>{s.description&&<p>{s.description}</p>}<span>{formatMoney(s.price_eur)}</span></div>
                <button type="button" className="button secondary small" onClick={()=>setChosenService(s.id)}>
                  Solicitar <ArrowRight size={14}/>
                </button>
              </div>)}</div>}
            {chosenService&&<form className="as-social-request-form as-company-request-form" onSubmit={sendRequest}>
              <div className="as-company-section-title"><span>HACER UNA SOLICITUD</span><h3>Solicitar {selectedService?.title}</h3></div>
              <label>Fecha deseada (opcional)<input type="date" value={requestDate} onChange={e=>setRequestDate(e.target.value)}/></label>
              <label>Cuéntanos qué necesitas<textarea rows={3} maxLength={2000} value={requestNotes} onChange={e=>setRequestNotes(e.target.value)}/></label>
              <p>Compartiremos los datos de contacto de tu perfil con este negocio para gestionar la solicitud.</p>
              <div className="as-company-request-actions">
                <button type="button" className="button secondary" onClick={()=>setChosenService(null)}>Cancelar</button>
                <button type="submit" className="button primary" disabled={busy}>Confirmar solicitud <ArrowRight size={15}/></button>
              </div>
            </form>}
          </section>

          {locations.some(l=>l.organization_id===selectedOrganization.id)&&<section className="as-company-section" aria-labelledby="company-locations">
            <div className="as-company-section-title"><span>03 / DÓNDE ENCONTRARNOS</span><h2 id="company-locations">Sedes y ubicaciones</h2></div>
            <div className="as-company-location-list">
              {locations.filter(l=>l.organization_id===selectedOrganization.id).map(l=><div key={l.id} className="as-company-location">
                <MapPin size={20}/>
                <div><strong>{l.name}</strong><p>{[l.address,l.city].filter(Boolean).join(" · ")||"Ubicación por concretar"}</p>
                  <small>{l.availability_mode==="cita"?"Con cita previa":"Consultar disponibilidad"}</small></div>
                {(hasValidCoordinates(l.latitude,l.longitude)||l.address||l.city)&&<a className="button secondary small" target="_blank" rel="noopener noreferrer"
                  href={hasValidCoordinates(l.latitude,l.longitude)?`https://www.openstreetmap.org/?mlat=${l.latitude}&mlon=${l.longitude}#map=17/${l.latitude}/${l.longitude}`:"https://www.openstreetmap.org/search?query="+encodeURIComponent([l.address,l.city].filter(Boolean).join(", "))}>Ver mapa</a>}
              </div>)}
            </div>
          </section>}
        </div>

        <aside className="as-company-page-side">
          <div className="as-company-contact-panel">
            <span>¿HABLAMOS?</span><h2>Tu próximo proyecto empieza aquí.</h2>
            <p>Consulta disponibilidad, pide información o habla directamente con este negocio.</p>
            <button type="button" className="button primary" onClick={()=>openMessages(selectedOrganization.id)}>
              <MessageCircle size={17}/> Enviar mensaje <ArrowRight size={16}/>
            </button>
          </div>
          <section className="as-company-updates" aria-label="Novedades del negocio">
            <div className="as-company-section-title"><span>COMUNIDAD</span><h2>Últimas novedades</h2></div>
            {posts.filter(p=>p.organization_id===selectedOrganization.id).length===0
              ?<p className="as-company-muted">Todavía no hay publicaciones de esta empresa.</p>
              :<div className="as-company-posts">
                {posts.filter(p=>p.organization_id===selectedOrganization.id).slice(0,8).map(post=><article key={post.id} className="as-company-post">
                  <div className="as-company-post-author">
                    <span className="as-company-post-avatar">{mediaUrl(selectedOrganization.avatar_url)
                      ?<img src={mediaUrl(selectedOrganization.avatar_url)} alt="" onError={e=>{e.currentTarget.style.display="none";}}/>
                      :selectedOrganization.name.slice(0,1).toUpperCase()}</span>
                    <div><strong>{selectedOrganization.name}</strong><small>{new Date(post.created_at).toLocaleDateString("es-ES")}</small></div>
                  </div>
                  {post.body&&<p>{post.body}</p>}
                  {mediaUrl(post.media_url)&&post.media_kind==="image"&&<img className="as-company-post-media" src={mediaUrl(post.media_url)} alt="Foto publicada por el negocio"/>}
                  {mediaUrl(post.media_url)&&post.media_kind==="video"&&<BusinessVideo className="as-company-post-media" controls preload="metadata" src={mediaUrl(post.media_url)}/>}
                </article>)}
              </div>}
          </section>
        </aside>
      </div>
        </div>}
    </Modal>}
    {notice&&<div className="as-social-notice" role="status">{notice}<button type="button" onClick={()=>setNotice("")} aria-label="Cerrar mensaje">×</button></div>}
    <footer className="as-social-footer"><ShieldCheck size={14}/> Los negocios, servicios, mensajes, favoritos y publicaciones son reales. Las reservas automáticas todavía están en desarrollo. El mapa muestra únicamente sedes con coordenadas verificadas por sus propietarios.</footer>
  </div>;
}
