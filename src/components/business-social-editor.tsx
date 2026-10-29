"use client";
import { useEffect,useState,type ChangeEvent,type FormEvent } from "react";
import { ImagePlus, Camera, Send, ShieldCheck, Sparkles, Trash2, Eye, EyeOff, Video, Palette } from "lucide-react";
import { getSupabase } from "@/lib/supabase/client";
import "./customer-social.css";

type CompanyIdentity={id:string;name:string;tagline:string;accent_color:string;avatar_url:string;cover_url:string;published:boolean};
type Post={id:string;organization_id:string;body:string;media_url:string;media_kind:"image"|"video"|null;published:boolean;created_at:string};
const mediaBucket="autonoservice-public-media";
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
 async function upload(file:File){
  if(!db)throw Error("Sin conexión.");
  validateFile(file);
  const ext=({ "image/jpeg":"jpg","image/png":"png","image/webp":"webp","video/mp4":"mp4","video/webm":"webm" } as Record<string,string>)[file.type];
  const path=organizationId+"/"+crypto.randomUUID()+"."+ext;
  const {error}=await db.storage.from(mediaBucket).upload(path,file,{contentType:file.type,upsert:false});
  if(error)throw error;
  return db.storage.from(mediaBucket).getPublicUrl(path).data.publicUrl;
 }
 async function onImageUpload(e:ChangeEvent<HTMLInputElement>,field:"avatar_url"|"cover_url"){
  const file=e.target.files?.[0];e.target.value="";
  if(!file||!db)return;
  void execute(async()=>{
    if(!file.type.startsWith("image/"))throw Error("La portada y el avatar deben ser imágenes.");
    const url=await upload(file);
    const {error}=await db.from("organizations").update({[field]:url}).eq("id",organizationId);
    if(error)throw error;
    setMessage(
      (field==="avatar_url"?"Imagen de perfil actualizada.":"Portada actualizada.")+
      (company?.published?" Visible para los clientes al actualizar el directorio.":" El negocio sigue siendo privado. Pulsa «Publicar mi empresa» para verlo desde Cliente.")
    );
    setReload(x=>x+1);
  });
 }
 const changeVisibility=()=>{
   if(!db||!company)return;
   void execute(async()=>{
     const next=!company.published;
     const {error}=await db.from("organizations").update({published:next}).eq("id",organizationId);
     if(error)throw error;
     setCompany(prev=>prev?{...prev,published:next}:prev);
     setMessage(next
       ?"Perfil publicado. Ahora podrás verlo desde Cliente → Explorar."
       :"Perfil privado. Ya no aparecerá en Explorar para otros clientes.");
     setReload(x=>x+1);
   });
 };
 const saveIdentity=(e:FormEvent)=>{
  e.preventDefault();if(!db)return;
  void execute(async()=>{
    const {error}=await db.from("organizations").update({tagline:tagline.trim(),accent_color:accent}).eq("id",organizationId);
    if(error)throw error;
    setMessage("Identidad visual guardada.");
    setReload(x=>x+1);
  });
 };
 const publish=(e:FormEvent)=>{
  e.preventDefault();if(!db)return;
  void execute(async()=>{
    if(!postPublished&&media)throw Error("Los archivos se guardan en un contenedor público. Guarda el borrador solo con texto o publica la foto cuando esté lista.");
    let url="",kind:null|"image"|"video"=null;
    if(media){url=await upload(media);kind=media.type.startsWith("video/")?"video":"image";}
    if(!body.trim()&&!url)throw Error("Escribe una publicación o añade una foto o vídeo.");
    const {error}=await db.from("business_posts").insert({
      organization_id:organizationId,body:body.trim(),media_url:url,media_kind:kind,published:postPublished
    });
    if(error)throw error;
    setBody("");setMedia(null);setReload(x=>x+1);
    setMessage(postPublished?"Publicación guardada. Si tu empresa es pública, estará visible en su perfil y en las novedades.":"Borrador guardado en privado.");
  });
 };
 async function toggle(id:string,published:boolean){
  if(!db)return;
  if(published&&posts.find(p=>p.id===id)?.media_url){
    setMessage("Para retirar una foto o vídeo publicado, elimina la publicación. Cambiar su estado no revoca la URL pública.");
    return;
  }
  void execute(async()=>{
    const {error}=await db.from("business_posts").update({published:!published}).eq("id",id).eq("organization_id",organizationId);
    if(error)throw error;setReload(x=>x+1);
  });
 }
 async function remove(id:string){
  if(!db)return;
  if(!window.confirm("¿Eliminar esta publicación de forma permanente?"))return;
  void execute(async()=>{
    const post=posts.find(p=>p.id===id);
    const {error}=await db.from("business_posts").delete().eq("id",id).eq("organization_id",organizationId);
    if(error)throw error;
    let cleanupError="";
    if(post?.media_url){
      try{
        const url=new URL(post.media_url);
        const prefix="/storage/v1/object/public/"+mediaBucket+"/";
        const start=url.pathname.indexOf(prefix);
        if(start>=0){
          const path=decodeURIComponent(url.pathname.slice(start+prefix.length));
          if(path.startsWith(organizationId+"/")){
            const {error:removeError}=await db.storage.from(mediaBucket).remove([path]);
            if(removeError)cleanupError=removeError.message;
          }
        }
      }catch(e){cleanupError=e instanceof Error?e.message:"No se pudo limpiar el archivo.";}
    }
    setReload(x=>x+1);
    setMessage(cleanupError?"La publicación se eliminó, pero su archivo requiere limpieza manual: "+cleanupError:"Publicación eliminada.");
  });
 }
 return <section className="live-card social-business-editor">
  <div className="business-live-section-head"><div><span className="eyebrow">MI MARCA Y MI COMUNIDAD</span>
    <h2>Personaliza tu perfil público</h2>
    <p className="live-muted">Haz reconocible tu negocio. Los cambios se guardan en tu cuenta y las publicaciones aparecen en la experiencia Cliente cuando las publicas.</p>
  </div></div>
  {company&&<div className="business-profile-publication-state" role="status">
    <div><strong>{company.published?"Tu perfil es público":"Tu perfil es privado"}</strong>
      <p>{company.published
        ?"Los clientes pueden encontrar esta empresa, ver su portada y abrir el perfil completo."
        :"Tus cambios están guardados, pero los clientes no pueden verlos hasta que publiques esta empresa."}</p>
    </div>
    <div className="business-profile-publication-actions">
      <button className={company.published?"button secondary":"button primary"} type="button" disabled={busy} onClick={changeVisibility}>
        {company.published?"Ocultar mi empresa":"Publicar mi empresa"}
      </button>
      {company.published&&<a className="button secondary" href={"/cliente?negocio="+company.id}>Ver como Cliente</a>}
    </div>
  </div>}
  <div className="social-business-cover" style={{backgroundColor:company?.accent_color||accent}}>
    {company?.cover_url?<img src={company.cover_url} alt={"Portada de "+company.name}/>:<div className="social-business-cover-placeholder"><Camera size={38}/><span>Tu marca, tu historia</span></div>}
    <div className="social-business-logo">
      {company?.avatar_url?<img src={company.avatar_url} alt={"Logo de "+company.name}/>:<span>{company?.name.slice(0,1)||"A"}</span>}
    </div>
  </div>
  <div className="social-business-upload-actions">
    <label className="button secondary"><Camera size={15}/> Cambiar logo<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>onImageUpload(e,"avatar_url")} disabled={busy}/></label>
    <label className="button secondary"><ImagePlus size={15}/> Cambiar portada<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>onImageUpload(e,"cover_url")} disabled={busy}/></label>
  </div>
  <form className="social-brand-form" onSubmit={saveIdentity}>
    <label>Frase de presentación<input maxLength={180} value={tagline} onChange={e=>setTagline(e.target.value)} placeholder="Ej. Capturamos momentos que importan"/></label>
    <div className="social-brand-palette"><strong><Palette size={15}/> Color de marca</strong><div>
      {accents.map(color=><button key={color} type="button" className={accent===color?"selected":""} style={{backgroundColor:color}}
        aria-label={"Seleccionar color "+color} aria-pressed={accent===color} onClick={()=>setAccent(color)}/>)}
    </div></div>
    <button type="submit" className="button primary" disabled={busy}>Guardar estilo</button>
  </form>
  <div className="social-business-divider"/>
  <div className="business-live-section-head"><div><span className="eyebrow">COMPARTIR NOVEDADES</span>
    <h2>Publicaciones de tu empresa</h2>
    <p className="live-muted">Fotos, vídeos cortos, noticias y ofertas para las personas que siguen tu negocio.</p>
  </div></div>
  <form className="social-publish-form" onSubmit={publish}>
    <textarea rows={4} maxLength={3000} value={body} onChange={e=>setBody(e.target.value)}
       placeholder="¿Qué novedades quieres compartir con tus clientes?"/>
    <div className="social-publish-actions">
      <label className="button secondary"><ImagePlus size={15}/>{media?media.name:"Añadir foto o vídeo"}
        <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" disabled={busy} onChange={e=>setMedia(e.target.files?.[0]||null)}/>
      </label>
      <label className="social-publish-toggle"><input type="checkbox" checked={postPublished} onChange={e=>setPostPublished(e.target.checked)}/> Publicar en mi perfil</label>
      <button className="button primary" type="submit" disabled={busy}><Send size={15}/> {postPublished?"Publicar":"Guardar borrador"}</button>
    </div>
  </form>
  <div className="social-business-posts">
    {posts.length===0&&<p className="live-muted">Aún no has publicado novedades. Puedes comenzar con una foto de tu trabajo o una presentación de tu empresa.</p>}
    {posts.map(post=><article className="social-post-card" key={post.id}>
      <div className="social-post-top"><strong>{company?.name||"Mi negocio"}</strong><small>{new Date(post.created_at).toLocaleDateString("es-ES")}</small>
        <span>{post.published?"Público":"Borrador"}</span></div>
      {post.body&&<p>{post.body}</p>}
      {post.media_url&&post.media_kind==="image"&&<img src={post.media_url} alt="Imagen de publicación"/>}
      {post.media_url&&post.media_kind==="video"&&<video controls preload="metadata" src={post.media_url}/>}
      <div className="social-post-actions">
       <button type="button" className="button secondary small" onClick={()=>toggle(post.id,post.published)} disabled={busy||Boolean(post.published&&post.media_url)}>{post.published?<EyeOff size={14}/>:<Eye size={14}/>} {post.published&&post.media_url?"Eliminar para retirar":post.published?"Hacer privado":"Publicar"}</button>
       <button type="button" className="button secondary small" onClick={()=>remove(post.id)} disabled={busy}><Trash2 size={14}/> Eliminar</button>
      </div>
    </article>)}
  </div>
  {message&&<p className="live-alert" role="status">{message}</p>}
  <p className="live-muted"><ShieldCheck size={13}/> Los archivos subidos al perfil son públicos. Los borradores con fotos o vídeos se deshabilitan para proteger su privacidad; eliminar una publicación también intenta eliminar el archivo. No compartas datos privados ni imágenes sin permiso.</p>
 </section>;
}
