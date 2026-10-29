"use client";

import { useEffect, useState, type FormEvent } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { MessageCircle, Send, RefreshCw, ShieldCheck, Inbox, Paperclip, Download } from "lucide-react";

type Org = { id:string; name:string };
type Conversation = { id:string; organization_id:string; customer_id:string; customer_display_name:string; created_at:string };
type Message = { id:string; conversation_id:string; sender_id:string; actor_role:"customer"|"business"; body:string; created_at:string;
 attachment_path:string;attachment_name:string;attachment_mime:string;attachment_size:number|null};

export function SocialInbox({
  userId,role,organizationId,targetOrganizationId,organizations=[]
}:{
  userId:string;
  role:"customer"|"business";
  organizationId?:string;
  targetOrganizationId?:string|null;
  organizations?:Org[];
}){
 const db=getSupabase();
 const [threads,setThreads]=useState<Conversation[]>([]);
 const [selected,setSelected]=useState("");
 const [messages,setMessages]=useState<Message[]>([]);
 const [draft,setDraft]=useState("");
 const [file,setFile]=useState<File|null>(null);
 const [unread,setUnread]=useState<Record<string,number>>({});
 const [error,setError]=useState("");
 const [loading,setLoading]=useState(false);
 const [refreshId,setRefreshId]=useState(0);
 
 const refresh=()=>setRefreshId(n=>n+1);
 // The original inbox only refreshed when clicking its button. That made
 // successfully delivered messages look lost in a second browser session.
 // Poll private RLS-filtered threads every 6 seconds until realtime is enabled.
 useEffect(()=>{
   const interval=window.setInterval(()=>setRefreshId(n=>n+1),6000);
   const onFocus=()=>setRefreshId(n=>n+1);
   window.addEventListener("focus",onFocus);
   return ()=>{window.clearInterval(interval);window.removeEventListener("focus",onFocus);};
 },[]);


 useEffect(()=>{
   if(!db){setError("No existe conexión con Supabase.");return;}
   let active=true;
   // A single login can be both Cliente and Empresa. RLS permits both sets,
   // so a business inbox MUST explicitly limit its organization IDs.
   // Otherwise personal Cliente threads would appear in the professional inbox.
   const ownOrganizationIds=organizations.map(o=>o.id);
   if(role==="business" && ownOrganizationIds.length===0){
     setThreads([]);setSelected("");return;
   }
   const base=db.from("conversations").select("id,organization_id,customer_id,customer_display_name,created_at").order("created_at",{ascending:false});
   (role==="business"?base.in("organization_id",ownOrganizationIds):base.eq("customer_id",userId))
      .then(({data,error})=>{
        if(!active)return;
        if(error){setError(error.message);return;}
        const next=(data||[]) as Conversation[];
        setThreads(next);
        setSelected(id=>role==="customer" && targetOrganizationId
          ?(next.find(t=>t.organization_id===targetOrganizationId)?.id||"")
          :next.some(t=>t.id===id)?id:(next[0]?.id||""));
      });
   return ()=>{active=false;};
 },[db,role,organizationId,userId,targetOrganizationId,refreshId,organizations]);

 useEffect(()=>{
   if(!db||!selected){setMessages([]);return;}
   let active=true;
   db.from("conversation_messages").select("id,conversation_id,sender_id,actor_role,body,created_at,attachment_path,attachment_name,attachment_mime,attachment_size")
     .eq("conversation_id",selected).order("created_at",{ascending:true}).limit(200)
     .then(({data,error})=>{
       if(!active)return;
       if(error){setError(error.message);return;}
       setMessages((data||[]) as Message[]);
       // A seen conversation is acknowledged for the currently selected
       // Empresa/Cliente context, even if both share one login.
       void db.from("conversation_read_states").upsert({
         conversation_id:selected,user_id:userId,actor_role:role,read_at:new Date().toISOString()
       },{onConflict:"conversation_id,user_id,actor_role"}).then(({error:readError})=>{
         if(readError)console.warn("Could not update read cursor:",readError.message);
         else if(active)setUnread(current=>({...current,[selected]:0}));
       });
     });
   return ()=>{active=false;};
 },[db,selected,refreshId,role,userId]);

 useEffect(()=>{
   if(!db||threads.length===0){setUnread({});return;}
   let active=true;
   const ids=threads.map(t=>t.id);
   Promise.all([
    db.from("conversation_read_states").select("conversation_id,read_at").eq("user_id",userId).eq("actor_role",role).in("conversation_id",ids),
    db.from("conversation_messages").select("conversation_id,actor_role,created_at").in("conversation_id",ids).neq("actor_role",role).order("created_at",{ascending:false}).limit(2000)
   ]).then(([reads,msgs])=>{
     if(!active)return;
     if(reads.error||msgs.error){setError(reads.error?.message||msgs.error?.message||"Error al cargar notificaciones.");return;}
     const cutoff=new Map((reads.data||[]).map(v=>[v.conversation_id,new Date(v.read_at).getTime()]));
     const counts:Record<string,number>={};
     for(const m of msgs.data||[]){
       const last=cutoff.get(m.conversation_id)||0;
       if(new Date(m.created_at).getTime()>last)counts[m.conversation_id]=(counts[m.conversation_id]||0)+1;
     }
     if(selected)counts[selected]=0;
     setUnread(counts);
   });
   return ()=>{active=false;};
 },[db,threads,role,userId,refreshId,selected]);

 const activeThread=threads.find(t=>t.id===selected);
 const pendingOrg=role==="customer" && !!targetOrganizationId && !threads.some(t=>t.organization_id===targetOrganizationId);
 const newTarget=pendingOrg?targetOrganizationId:null;
 const currentCompany=activeThread?.organization_id||newTarget||organizationId||"";
 const label=organizations.find(o=>o.id===currentCompany)?.name||"Conversación privada";

 

 async function send(event:FormEvent){
   event.preventDefault();
   const body=draft.trim();
   if(!db||(!body&&!file)||body.length>2000||loading)return;
   setLoading(true);setError("");
   try {
     let threadId=selected;
     if(!threadId) {
       if(role!=="customer"||!newTarget)throw Error("Selecciona una conversación.");
       const {data:existing,error:readError}=await db.from("conversations").select("id")
         .eq("customer_id",userId).eq("organization_id",newTarget).maybeSingle();
       if(readError)throw readError;
       if(existing?.id) threadId=existing.id;
       else {
         const {data:created,error:createError}=await db.from("conversations")
           .insert({organization_id:newTarget,customer_id:userId}).select("id").single();
         if(createError){
           // If a second tab created the same thread, refresh to retry rather than
           // silently showing a message that was never sent.
           throw createError;
         }
         threadId=created.id;
       }
     }
     let attachment_path="",attachment_name="",attachment_mime="",attachment_size:null|number=null;
     if(file){
       const types=["image/jpeg","image/png","image/webp","application/pdf","text/plain"];
       if(!types.includes(file.type))throw Error("Adjunta JPG, PNG, WebP, PDF o TXT.");
       if(file.size===0||file.size>10*1024*1024||file.name.length>120)throw Error("El archivo debe ocupar hasta 10 MB y su nombre hasta 120 caracteres.");
       const ext=({"image/jpeg":"jpg","image/png":"png","image/webp":"webp","application/pdf":"pdf","text/plain":"txt"} as Record<string,string>)[file.type];
       attachment_path=threadId+"/"+crypto.randomUUID()+"."+ext;
       attachment_name=file.name;attachment_mime=file.type;attachment_size=file.size;
       const {error:uploadError}=await db.storage.from("autonoservice-private-chat").upload(attachment_path,file,{contentType:file.type,upsert:false});
       if(uploadError)throw uploadError;
     }
     const {error:messageError}=await db.from("conversation_messages").insert({
       conversation_id:threadId,sender_id:userId,actor_role:role,body,
       attachment_path,attachment_name,attachment_mime,attachment_size
     });
     if(messageError){
       if(attachment_path)void db.storage.from("autonoservice-private-chat").remove([attachment_path]);
       throw messageError;
     }
     setDraft("");setFile(null);setSelected(threadId);refresh();
   } catch(e){setError(e instanceof Error?e.message:"No se ha podido enviar el mensaje.");}
   finally {setLoading(false);}
 }
 async function openAttachment(path:string){
   if(!db)return;
   setError("");
   const {data,error}=await db.storage.from("autonoservice-private-chat").createSignedUrl(path,60);
   if(error||!data?.signedUrl){setError(error?.message||"No se pudo abrir el adjunto.");return;}
   window.location.assign(data.signedUrl);
 }
 const isActive=(t:Conversation)=>t.id===selected;
 return <section className="as-social-inbox" aria-label="Mensajes reales">
   <div className="as-social-inbox-intro">
     <div><span className="eyebrow">CONVERSACIONES</span><h2>Mensajes</h2><p>Mensajes de todos tus negocios y sedes, reunidos en una sola bandeja. Se actualizan automáticamente.</p></div>
     <button type="button" className="button secondary" onClick={refresh}><RefreshCw size={15}/> Actualizar</button>
   </div>
   <div className="as-social-chat-grid">
    <aside className="as-social-thread-list" aria-label="Tus conversaciones">
      {threads.length===0&&!newTarget&&<div className="as-social-empty"><Inbox size={25}/><strong>Sin conversaciones todavía</strong><span>{role==="customer"?"Visita un negocio y pulsa «Mensaje» para escribirle.":"Las conversaciones aparecerán cuando alguien contacte con tu negocio."}</span></div>}
      {threads.map(thread=><button key={thread.id} type="button"
       className={isActive(thread)?"as-social-thread is-active":"as-social-thread"}
       onClick={()=>{setSelected(thread.id);setError("");}}>
         <span className="as-social-thread-avatar"><MessageCircle size={17}/></span>
         <span><strong>{role==="business"?(thread.customer_display_name||"Cliente")+" · "+(organizations.find(o=>o.id===thread.organization_id)?.name||"Negocio"):
            organizations.find(o=>o.id===thread.organization_id)?.name||"Negocio"}</strong><small>Conversación privada {unread[thread.id]>0&&<b className="as-social-unread-count">{unread[thread.id]} sin leer</b>}</small></span>
       </button>)}
      {newTarget&&<button type="button" className="as-social-thread is-active" onClick={()=>setSelected("")}>
        <span className="as-social-thread-avatar"><MessageCircle size={17}/></span>
        <span><strong>{organizations.find(o=>o.id===newTarget)?.name||"Nuevo mensaje"}</strong><small>Iniciar conversación</small></span>
      </button>}
    </aside>
    <div className="as-social-chat-main">
       {(activeThread||newTarget)?<>
        <div className="as-social-chat-heading"><span className="as-social-thread-avatar"><MessageCircle size={17}/></span>
         <div><strong>{role==="business"?activeThread?.customer_display_name||"Conversación con un cliente":label}</strong>
          <small><ShieldCheck size={12}/> Solo participantes autorizados</small>
         </div></div>
        <div className="as-social-message-list" role="log" aria-live="polite">
         {messages.length===0&&<div className="as-social-empty"><MessageCircle size={23}/><strong>Inicia la conversación</strong><span>No se ha enviado ningún mensaje todavía.</span></div>}
         {messages.map(m=><div key={m.id} className={m.actor_role===role?"as-social-message mine":"as-social-message"}>
            <div className="as-social-message-meta">{m.actor_role===role?"Tú":m.actor_role==="business"?"Negocio":"Cliente"} · {new Date(m.created_at).toLocaleString("es-ES",{dateStyle:"short",timeStyle:"short"})}</div>
            {m.body&&<p>{m.body}</p>}
            {m.attachment_path&&<button type="button" className="as-social-file-button" onClick={()=>openAttachment(m.attachment_path)}>
              <Download size={14}/>{m.attachment_name||"Abrir archivo"}{m.attachment_size?" · "+Math.round(m.attachment_size/1024)+" KB":""}
            </button>}
          </div>)}
        </div>
        <form className="as-social-chat-compose" onSubmit={send}>
          <label htmlFor="live-message" className="sr-only">Tu mensaje</label>
          <div className="as-social-compose-fields"><textarea id="live-message" value={draft} onChange={e=>setDraft(e.target.value)} maxLength={2000}
           placeholder="Escribe tu mensaje…" rows={2}/>
           <label className="as-social-attach-button"><Paperclip size={15}/>{file?file.name:"Adjuntar JPG, PNG, WebP, PDF o TXT"}
             <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf,text/plain" disabled={loading}
               onChange={e=>setFile(e.target.files?.[0]||null)}/>
           </label></div>
          <button className="button primary" type="submit" disabled={loading||(!draft.trim()&&!file)}>
            <Send size={15}/> Enviar
          </button>
        </form>
       </>:<div className="as-social-empty"><MessageCircle size={26}/><strong>Selecciona una conversación</strong><span>Aquí podrás hablar directamente con un negocio o con un cliente.</span></div>}
    </div>
   </div>
   {error&&<p className="live-alert" role="alert">{error}</p>}
   <p className="as-social-privacy-note"><ShieldCheck size={14}/> Mensajes y adjuntos privados, con indicador de no leídos y actualización aproximadamente cada seis segundos. Las notificaciones push y herramientas de bloqueo todavía están pendientes.</p>
 </section>;
}
