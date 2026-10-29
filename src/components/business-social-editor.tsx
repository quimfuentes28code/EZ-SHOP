"use client";
import { useEffect,useState,type ChangeEvent,type FormEvent } from "react";
import { ImagePlus, Camera, Send, ShieldCheck, Trash2, Eye, EyeOff, Palette } from "lucide-react";
import { getSupabase } from "@/lib/supabase/client";
import { BusinessVideo } from "@/components/business-video";
import { createUploadId } from "@/lib/upload-id";
import { BUSINESS_MEDIA_BUCKET, BUSINESS_MEDIA_URL_TTL_SECONDS, businessMediaPath, businessMediaReference, resolveBusinessMediaUrls } from "@/lib/business-media";
import "./customer-social.css";

type CompanyIdentity={id:string;name:string;tagline:string;accent_color:string;avatar_url:string;cover_url:string;published:boolean};
type Post={id:string;organization_id:string;body:string;media_url:string;media_kind:"image"|"video"|null;published:boolean;created_at:string};
const accepted=["image/jpeg","image/png","image/webp","video/mp4","video/webm"];
const accents=["#A47B53","#4E807C","#8A6DC2","#BB705E","#446B92","#647748"];

export function BusinessSocialEditor({organizationId}:{organizationId:string}){
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
 const [mediaUrls,setMediaUrls]=useState<Record<string,string>>({});
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
    db.from("organizations").select("id,name,tagline,accent_color,avatar_url,cover_url,published").eq("id",organizationId).single(),
    db.from("business_posts").select("id,organization_id,body,media_url,media_kind,published,created_at")
       .eq("organization_id",organizationId).order("created_at",{ascending:false})
  ]).then(([c,p])=>{
    if(!active)return;
    if(c.error||p.error){setMessage(c.error?.message||p.error?.message||"Error al cargar la información.");return;}
    const next=c.data as CompanyIdentity;
    setCompany(next);setTagline(next.tagline);setAccent(next.accent_color);
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
    setReload(x=>x+1);
  });
 }
 const saveIdentity=(e:FormEvent)=>{
  e.preventDefault();if(!db)return;
  void execute(async()=>{
    const {data,error}=await db.from("organizations").update({tagline:tagline.trim(),accent_color:accent}).eq("id",organizationId).select("id").single();
    if(error||!data)throw error||Error("No se pudo guardar la identidad visual.");
    setMessage("Identidad visual guardada.");
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
 return <section className="live-card social-business-editor">
  <div className="business-live-section-head"><div><span className="eyebrow">MI MARCA Y MI COMUNIDAD</span>
    <h2>Personaliza tu perfil público</h2>
    <p className="live-muted">Haz reconocible tu negocio. Los cambios se guardan en tu cuenta y las publicaciones aparecen en la experiencia Cliente cuando las publicas.</p>
  </div></div>
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
