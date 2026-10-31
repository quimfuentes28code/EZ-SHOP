"use client";
import { useEffect,useState,type ChangeEvent,type FormEvent } from "react";
import { ImagePlus, Camera, Send, ShieldCheck, Trash2, Eye, EyeOff, Palette, ChevronUp, ChevronDown, LayoutGrid } from "lucide-react";
import { getSupabase } from "@/lib/supabase/client";
import { BusinessVideo } from "@/components/business-video";
import { createUploadId } from "@/lib/upload-id";
import { BUSINESS_MEDIA_BUCKET, BUSINESS_MEDIA_URL_TTL_SECONDS, businessMediaPath, businessMediaReference, resolveBusinessMediaUrls } from "@/lib/business-media";
import "./customer-social.css";
import { DEFAULT_PROFILE_SECTIONS, PROFILE_SECTIONS, normalizeProfileSections, profileSectionPreset, type ProfileSectionId } from "@/lib/business-profile-layout";

type CompanyIdentity={id:string;name:string;category:string;tagline:string;accent_color:string;avatar_url:string;cover_url:string;published:boolean;profile_sections:unknown};
type Post={id:string;organization_id:string;body:string;media_url:string;media_kind:"image"|"video"|null;published:boolean;created_at:string};
const accepted=["image/jpeg","image/png","image/webp","video/mp4","video/webm"];
const accents=["#A47B53","#4E807C","#8A6DC2","#BB705E","#446B92","#647748"];

export function BusinessSocialEditor({organizationId,organizationPublished,onProfileChange}:{
 organizationId:string;organizationPublished?:boolean;onProfileChange?:()=>void;
}){
 const db=getSupabase();
 const [company,setCompany]=useState<CompanyIdentity|null>(null);
 const [posts,setPosts]=useState<Post[]>([]);
 const [tagline,setTagline]=useState("");
 const [accent,setAccent]=useState("#A47B53");
 const [body,setBody]=useState("");
 const [media,setMedia]=useState<File|null>(null);
 const [postPublished,setPostPublished]=useState(true);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const [reload,setReload]=useState(0);
 const [sectionOrder,setSectionOrder]=useState<ProfileSectionId[]>([...DEFAULT_PROFILE_SECTIONS]);
 const [visibleSections,setVisibleSections]=useState<ProfileSectionId[]>([...DEFAULT_PROFILE_SECTIONS]);
 const [mediaUrls,setMediaUrls]=useState<Record<string,string>>({});
 useEffect(()=>{
  if(organizationPublished!==undefined)setCompany(current=>current?{...current,published:organizationPublished}:current);
 },[organizationPublished]);
 const mediaReferences=JSON.stringify([company?.avatar_url||"",company?.cover_url||"",...posts.map(post=>post.media_url)]);
 useEffect(()=>{
  if(!db)return;
  let active=true;
  const refreshUrls=()=>{
   if(document.visibilityState==="hidden")return;
   void resolveBusinessMediaUrls(db,JSON.parse(mediaReferences) as string[])
    .then(urls=>{if(active)setMediaUrls(urls);})
    .catch(()=>{if(active)setMessage("No se pudieron cargar algunas imágenes. Vuelve a actualizar el perfil.");});
  };
  refreshUrls();
  const interval=window.setInterval(refreshUrls,(BUSINESS_MEDIA_URL_TTL_SECONDS-15)*1000);
  document.addEventListener("visibilitychange",refreshUrls);
  return ()=>{active=false;window.clearInterval(interval);document.removeEventListener("visibilitychange",refreshUrls);};
 },[db,mediaReferences]);
 useEffect(()=>{
  if(!db||!organizationId)return;
  let active=true;
  Promise.all([
    db.from("organizations").select("id,name,category,tagline,accent_color,avatar_url,cover_url,published,profile_sections").eq("id",organizationId).single(),
    db.from("business_posts").select("id,organization_id,body,media_url,media_kind,published,created_at")
       .eq("organization_id",organizationId).order("created_at",{ascending:false})
  ]).then(([c,p])=>{
    if(!active)return;
    if(c.error||p.error||!c.data){setMessage(c.error?.message||p.error?.message||"No se pudo cargar el perfil comercial.");return;}
    const next=c.data as CompanyIdentity;
    setCompany(next);setTagline(next.tagline);setAccent(next.accent_color);
    const shown=normalizeProfileSections(next.profile_sections);
    setVisibleSections(shown);
    setSectionOrder([...shown,...DEFAULT_PROFILE_SECTIONS.filter(id=>!shown.includes(id))]);
    setPosts((p.data||[]) as Post[]);
  });
  return ()=>{active=false;};
 },[db,organizationId,reload]);
 async function execute(fn:()=>Promise<void>){
  if(busy)return;setBusy(true);setMessage("");
  try{await fn();}catch(e){setMessage(e instanceof Error?e.message:"No se pudo completar la operación.");}
  finally{setBusy(false);}
 }
 const validateFile=(file:File)=>{
  if(!accepted.includes(file.type))throw Error("Formatos admitidos: JPG, PNG, WebP, MP4 y WebM.");
  const limit=file.type.startsWith("video/")?20*1024*1024:5*1024*1024;
  if(file.size>limit||file.size===0)throw Error(file.type.startsWith("video/")?"El vídeo debe ocupar entre 1 byte y 20 MB.":"La imagen debe ocupar entre 1 byte y 5 MB.");
 };
 async function requirePrivateMedia(){
  if(!db)throw Error("Sin conexión.");
  const {data,error}=await db.rpc("autonoservice_business_media_private");
  if(error||data!==true)throw Error("Las subidas y los cambios de privacidad de archivos están desactivados hasta completar la actualización de protección de medios.");
 }
 async function upload(file:File){
  if(!db)throw Error("Sin conexión.");
  validateFile(file);
  await requirePrivateMedia();
  const ext=({ "image/jpeg":"jpg","image/png":"png","image/webp":"webp","video/mp4":"mp4","video/webm":"webm" } as Record<string,string>)[file.type];
  const path=organizationId+"/"+createUploadId()+"."+ext;
  const {error}=await db.storage.from(BUSINESS_MEDIA_BUCKET).upload(path,file,{contentType:file.type,upsert:false});
  if(error)throw error;
  return businessMediaReference(path);
 }
 async function cleanupMedia(reference:string){
  const path=businessMediaPath(reference);
  if(!db||!path||!path.startsWith(organizationId+"/"))return true;
  const {error}=await db.storage.from(BUSINESS_MEDIA_BUCKET).remove([path]);
  return !error;
 }
 async function onImageUpload(e:ChangeEvent<HTMLInputElement>,field:"avatar_url"|"cover_url"){
  const file=e.target.files?.[0];e.target.value="";
  if(!file||!db)return;
  void execute(async()=>{
    if(!file.type.startsWith("image/"))throw Error("La portada y el avatar deben ser imágenes.");
    const previous=company?.[field]||"";
    const url=await upload(file);
    const {data,error}=await db.from("organizations").update({[field]:url}).eq("id",organizationId).select("id").single();
    if(error||!data){await cleanupMedia(url);throw error||Error("No se pudo guardar la imagen.");}
    const clean=await cleanupMedia(previous);
    setMessage((field==="avatar_url"?"Imagen de perfil actualizada.":"Portada actualizada.")+(clean?"":" No se pudo retirar el archivo anterior; vuelve a intentarlo más tarde."));
    onProfileChange?.();
    setReload(x=>x+1);
  });
 }
 const changeVisibility=()=>{
  if(!db||!company)return;
  void execute(async()=>{
    const published=!company.published;
    const {data,error}=await db.from("organizations").update({published}).eq("id",organizationId).select("id,published").maybeSingle();
    if(error||!data||data.published!==published)throw error||Error("No se pudo cambiar la visibilidad. Comprueba tus permisos y vuelve a intentarlo.");
    setCompany(current=>current?{...current,published}:current);
    onProfileChange?.();
    setMessage(published?"Perfil publicado. Ya puedes verlo desde Cliente → Explorar. Las sedes con pin y visibilidad autorizada aparecen en el mapa.":"Perfil privado. Ya no aparecerá en Explorar ni en el mapa para otros clientes.");
  });
 };
 const saveIdentity=(e:FormEvent)=>{
  e.preventDefault();if(!db)return;
  void execute(async()=>{
    const {data,error}=await db.from("organizations").update({tagline:tagline.trim(),accent_color:accent}).eq("id",organizationId).select("id").single();
    if(error||!data)throw error||Error("No se pudo guardar la identidad visual.");
    setMessage("Identidad visual guardada.");
    onProfileChange?.();
    setReload(x=>x+1);
  });
 };
 const publish=(e:FormEvent)=>{
  e.preventDefault();if(!db)return;
  void execute(async()=>{
    let url="",kind:null|"image"|"video"=null;
    if(media){url=await upload(media);kind=media.type.startsWith("video/")?"video":"image";}
    if(!body.trim()&&!url)throw Error("Escribe una publicación o añade una foto o vídeo.");
    const {error}=await db.from("business_posts").insert({
      organization_id:organizationId,body:body.trim(),media_url:url,media_kind:kind,published:postPublished
    });
    if(error){await cleanupMedia(url);throw error;}
    setBody("");setMedia(null);setReload(x=>x+1);
    setMessage(postPublished?"Publicación guardada. Si tu empresa es pública, estará visible en su perfil y en las novedades.":"Borrador guardado en privado.");
  });
 };
 async function toggle(id:string,published:boolean){
  if(!db)return;
  void execute(async()=>{
    await requirePrivateMedia();
    const {data,error}=await db.from("business_posts").update({published:!published}).eq("id",id).eq("organization_id",organizationId).select("id").single();
    if(error||!data)throw error||Error("No se pudo actualizar la publicación.");
    setMessage(published?"Publicación retirada. Los enlaces de esta versión duran 60 segundos; las copias ya descargadas no se retiran.":"Publicación visible cuando la empresa esté publicada.");
    setReload(x=>x+1);
  });
 }
 async function remove(id:string){
  if(!db)return;
  if(!window.confirm("¿Eliminar esta publicación de forma permanente?"))return;
  void execute(async()=>{
    await requirePrivateMedia();
    const post=posts.find(post=>post.id===id);
    const {data,error}=await db.from("business_posts").delete().eq("id",id).eq("organization_id",organizationId).select("id").single();
    if(error||!data)throw error||Error("No se pudo eliminar la publicación.");
    const clean=await cleanupMedia(post?.media_url||"");
    setMessage(clean?"Publicación eliminada. El archivo se retira si no lo utiliza otro contenido.":"Publicación eliminada. No se pudo limpiar el archivo; ha quedado privado y requiere limpieza posterior.");
    setReload(x=>x+1);
  });
 }
 function moveSection(index:number,delta:number){
  setSectionOrder(items=>{
    const next=[...items],target=index+delta;
    if(target<0||target>=next.length)return items;
    [next[index],next[target]]=[next[target],next[index]];
    return next;
  });
 }
 function toggleSection(id:ProfileSectionId,shown:boolean){
  setVisibleSections(items=>shown?[...items.filter(item=>item!==id),id]:items.filter(item=>item!==id));
 }
 function applyProfilePreset(){
  const preset=profileSectionPreset(company?.category||"");
  setSectionOrder(preset);
  setVisibleSections([...preset]);
 }
 function saveSectionLayout(){
  if(!db||!company)return;
  void execute(async()=>{
    const orderedVisible=sectionOrder.filter(id=>visibleSections.includes(id));
    const {data,error}=await db.from("organizations").update({profile_sections:orderedVisible})
      .eq("id",organizationId).select("id,profile_sections").maybeSingle();
    if(error)throw error;
    if(!data)throw Error("No tienes permiso para editar la distribución de este negocio.");
    setCompany(current=>current?{...current,profile_sections:data.profile_sections}:current);
    setVisibleSections(orderedVisible);
    onProfileChange?.();
    setMessage("Distribución guardada. Los clientes verán las secciones en este orden.");
  });
 }
 return <section className="live-card social-business-editor">
  <div className="business-live-section-head"><div><span className="eyebrow">MI MARCA Y MI COMUNIDAD</span>
    <h2>Diseño del perfil público</h2>
    <p className="live-muted">Estás editando el perfil de <strong>{company?.name||"tu empresa"}</strong>. La portada, el logo y las publicaciones se guardan por separado para cada negocio.</p>
  </div></div>
  {company&&<div className="business-live-publication" role="status">
    <div><strong>{company.name}: {company.published?"perfil público":"perfil privado"}</strong>
      <p>Portada: {company.cover_url?"imagen guardada":"sin imagen"} · Logo: {company.avatar_url?"imagen guardada":"sin imagen"}</p>
      <p>{company.published?"Los clientes pueden encontrar esta empresa y abrir su perfil comercial.":"Tus cambios están guardados. Publicar el negocio mostrará su perfil y las sedes y publicaciones que hayas marcado como públicas."}</p>
    </div>
    <div className="live-session-actions">
      <button className="button secondary" type="button" disabled={busy} onClick={changeVisibility}>{company.published?"Ocultar mi empresa":"Publicar mi empresa"}</button>
      {company.published&&<a className="button secondary" href={"/cliente?negocio="+encodeURIComponent(company.id)}>Ver como Cliente</a>}
    </div>
  </div>}
  <section className="as-profile-layout-editor" aria-labelledby="profile-layout-title">
    <div className="business-live-section-head"><div>
      <span className="eyebrow">MI ESCAPARATE</span>
      <h2 id="profile-layout-title"><LayoutGrid size={18}/> Organizar perfil público</h2>
      <p className="live-muted">Cambia el orden de las secciones y decide cuáles mostrar. La portada, el logo y los botones de contacto permanecen fijos.</p>
    </div></div>
    <div className="as-profile-layout-actions">
      <button className="button secondary small" type="button" disabled={busy||!company} onClick={applyProfilePreset}>Distribución sugerida para mi sector</button>
      <button className="button secondary small" type="button" disabled={busy||!company} onClick={()=>{
        setSectionOrder([...DEFAULT_PROFILE_SECTIONS]);
        setVisibleSections([...DEFAULT_PROFILE_SECTIONS]);
      }}>Restablecer</button>
      {company?.published&&<a className="button secondary small" href={"/cliente?negocio="+encodeURIComponent(organizationId)}>Previsualizar como Cliente <Eye size={14}/></a>}
    </div>
    <div className="as-profile-layout-items">
      {sectionOrder.map((id,index)=>{
        const definition=PROFILE_SECTIONS.find(entry=>entry.id===id)!;
        return <div className="as-profile-layout-item" key={id}>
          <label><input type="checkbox" disabled={busy||!company} checked={visibleSections.includes(id)}
            onChange={event=>toggleSection(id,event.target.checked)}/>
            <span>{definition.label}</span>
          </label>
          <div className="as-profile-layout-move">
            <button className="button secondary small" type="button" aria-label={"Subir "+definition.label}
              disabled={busy||index===0} onClick={()=>moveSection(index,-1)}><ChevronUp size={16}/></button>
            <button className="button secondary small" type="button" aria-label={"Bajar "+definition.label}
              disabled={busy||index===sectionOrder.length-1} onClick={()=>moveSection(index,1)}><ChevronDown size={16}/></button>
          </div>
        </div>;
      })}
    </div>
    <p className="live-muted">Portfolio utiliza fotos y vídeos ya publicados; Sedes requiere ubicaciones publicadas. Las secciones sin contenido se ocultan automáticamente al cliente. Las reseñas se añadirán cuando exista un sistema de valoraciones verificadas.</p>
    <button className="button primary" type="button" disabled={busy||!company} onClick={saveSectionLayout}>Guardar distribución del perfil</button>
  </section>
  <div className="social-business-cover" style={{backgroundColor:company?.accent_color||accent}}>
    {company?.cover_url&&mediaUrls[company.cover_url]?<img src={mediaUrls[company.cover_url]} alt={"Portada de "+company.name}/>:<div className="social-business-cover-placeholder"><Camera size={38}/><span>Tu marca, tu historia</span></div>}
    <div className="social-business-logo">
      {company?.avatar_url&&mediaUrls[company.avatar_url]?<img src={mediaUrls[company.avatar_url]} alt={"Logo de "+company.name}/>:<span>{company?.name.slice(0,1)||"A"}</span>}
    </div>
  </div>
  <div className="social-business-upload-actions">
    <label className="button secondary"><Camera size={15}/> Cambiar logo<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>onImageUpload(e,"avatar_url")} disabled={busy}/></label>
    <label className="button secondary"><ImagePlus size={15}/> Cambiar portada<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>onImageUpload(e,"cover_url")} disabled={busy}/></label>
  </div>
  <form className="social-brand-form" onSubmit={saveIdentity}>
    <label>Frase de presentación<input maxLength={180} value={tagline} disabled={busy} onChange={e=>setTagline(e.target.value)} placeholder="Ej. Capturamos momentos que importan"/></label>
    <div className="social-brand-palette"><strong><Palette size={15}/> Color de marca</strong><div>
      {accents.map(color=><button key={color} type="button" className={accent===color?"selected":""} style={{backgroundColor:color}}
        aria-label={"Seleccionar color "+color} aria-pressed={accent===color} disabled={busy} onClick={()=>setAccent(color)}/>)}
    </div></div>
    <button type="submit" className="button primary" disabled={busy}>Guardar estilo</button>
  </form>
  <div className="social-business-divider"/>
  <div className="business-live-section-head"><div><span className="eyebrow">COMPARTIR NOVEDADES</span>
    <h2>Publicaciones de tu empresa</h2>
    <p className="live-muted">Fotos, vídeos cortos, noticias y ofertas para las personas que siguen tu negocio.</p>
  </div></div>
  <form className="social-publish-form" onSubmit={publish}>
    <textarea rows={4} maxLength={3000} value={body} disabled={busy} onChange={e=>setBody(e.target.value)}
       placeholder="¿Qué novedades quieres compartir con tus clientes?"/>
    <div className="social-publish-actions">
      <label className="button secondary"><ImagePlus size={15}/>{media?media.name:"Añadir foto o vídeo"}
        <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" disabled={busy} onChange={e=>setMedia(e.target.files?.[0]||null)}/>
      </label>
      <label className="social-publish-toggle"><input type="checkbox" checked={postPublished} disabled={busy} onChange={e=>setPostPublished(e.target.checked)}/> Publicar en mi perfil</label>
      <button className="button primary" type="submit" disabled={busy}><Send size={15}/> {postPublished?"Publicar":"Guardar borrador"}</button>
    </div>
  </form>
  <div className="social-business-posts">
    {posts.length===0&&<p className="live-muted">Aún no has publicado novedades. Puedes comenzar con una foto de tu trabajo o una presentación de tu empresa.</p>}
    {posts.map(post=><article className="social-post-card" key={post.id}>
      <div className="social-post-top"><strong>{company?.name||"Mi negocio"}</strong><small>{new Date(post.created_at).toLocaleDateString("es-ES")}</small>
        <span>{post.published?"Público":"Borrador"}</span></div>
      {post.body&&<p>{post.body}</p>}
      {post.media_url&&mediaUrls[post.media_url]&&post.media_kind==="image"&&<img src={mediaUrls[post.media_url]} alt="Imagen de publicación"/>}
      {post.media_url&&mediaUrls[post.media_url]&&post.media_kind==="video"&&<BusinessVideo controls preload="metadata" src={mediaUrls[post.media_url]}/>}
      {post.media_url&&!mediaUrls[post.media_url]&&<p className="live-muted">Cargando archivo o archivo no disponible.</p>}
      <div className="social-post-actions">
       <button type="button" className="button secondary small" onClick={()=>toggle(post.id,post.published)} disabled={busy}>{post.published?<EyeOff size={14}/>:<Eye size={14}/>} {post.published?"Hacer privado":"Publicar"}</button>
       <button type="button" className="button secondary small" onClick={()=>remove(post.id)} disabled={busy}><Trash2 size={14}/> Eliminar</button>
      </div>
    </article>)}
  </div>
  {message&&<p className="live-alert" role="status">{message}</p>}
  <p className="live-muted"><ShieldCheck size={13}/> Los archivos de borradores requieren acceso autorizado. Publica solo fotografías y vídeos que tengas permiso para compartir. Los enlaces que genera esta versión duran 60 segundos; retirar una publicación no recupera copias ya descargadas.</p>
 </section>;
}
