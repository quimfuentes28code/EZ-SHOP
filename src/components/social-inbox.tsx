"use client";

import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { createUploadId } from "@/lib/upload-id";
import {
  MESSAGE_PAGE_SIZE, chronologicalMessages, contextConversations,
  conversationKey, laterReadCursor, latestReadCursor, mergeLatestMessages,
  olderMessagesFilter, type ConversationContext,
} from "@/lib/conversation-state";
import { MessageCircle, Send, RefreshCw, ShieldCheck, Inbox, Paperclip, Download } from "lucide-react";

type Org = { id:string; name:string };
type Conversation = { id:string; organization_id:string; customer_id:string; customer_display_name:string; created_at:string };
type Message = { id:string; conversation_id:string; sender_id:string; actor_role:ConversationContext; body:string; created_at:string;
 attachment_path:string;attachment_name:string;attachment_mime:string;attachment_size:number|null };
type Draft = { body:string; file:File|null };
type History = { messages:Message[]; hasOlder:boolean };
type Props = {
 userId:string; role:ConversationContext; organizationId?:string;
 targetOrganizationId?:string|null; organizations?:Org[];
};
const EMPTY_DRAFT:Draft={body:"",file:null};
const messageFields="id,conversation_id,sender_id,actor_role,body,created_at,attachment_path,attachment_name,attachment_mime,attachment_size";

export function SocialInbox(props:Props){
 // Neither cached messages nor drafts survive switching identity or experience.
 return <ContextInbox key={props.userId+":"+props.role} {...props}/>;
}

function ContextInbox({userId,role,organizationId,targetOrganizationId,organizations=[]}:Props){
 const db=getSupabase();
 const [threads,setThreads]=useState<Conversation[]>([]);
 const [selectedKey,setSelectedKey]=useState(role==="customer"&&targetOrganizationId?`organization:${targetOrganizationId}`:"");
 const [histories,setHistories]=useState<Record<string,History>>({});
 const [drafts,setDrafts]=useState<Record<string,Draft>>({});
 const [unread,setUnread]=useState<Record<string,number>>({});
 const [error,setError]=useState("");
 const [loading,setLoading]=useState(false);
 const [loadingMessages,setLoadingMessages]=useState(false);
 const [loadingOlder,setLoadingOlder]=useState(false);
 const [refreshId,setRefreshId]=useState(0);
 const mounted=useRef(true);
 const logRef=useRef<HTMLDivElement|null>(null);
 const scrollState=useRef({thread:"",first:"",last:"",height:0,atBottom:true});
 const [atBottom,setAtBottom]=useState(true);
 const selectedRef=useRef(selectedKey);selectedRef.current=selectedKey;
 const readCursors=useRef<Record<string,string>>({});
 const messageLoadVersion=useRef(0);
 const ownedIds=[...new Set(organizations.length?organizations.map(o=>o.id):organizationId?[organizationId]:[])].sort();
 const ownedSignature=ownedIds.join(",");
 const activeThread=threads.find(t=>conversationKey(t,role)===selectedKey);
 const selected=activeThread?.id||"";
 const newTarget=role==="customer"&&selectedKey.startsWith("organization:")&&!activeThread
   ?selectedKey.slice("organization:".length):null;
 const history=histories[selected];
 const messages=history?.messages||[];
 const {body:draft,file}=drafts[selectedKey]||EMPTY_DRAFT;
 const currentCompany=activeThread?.organization_id||newTarget||organizationId||"";
 const label=organizations.find(o=>o.id===currentCompany)?.name||"Conversación privada";
 const refresh=()=>setRefreshId(n=>n+1);
 const updateDraft=(update:Partial<Draft>)=>setDrafts(current=>({
   ...current,[selectedKey]:{...(current[selectedKey]||EMPTY_DRAFT),...update}
 }));
 useEffect(()=>{mounted.current=true;return ()=>{mounted.current=false;};},[]);
 useEffect(()=>{
   const interval=window.setInterval(refresh,6000);
   const onVisible=()=>{if(document.visibilityState==="visible")refresh();};
   window.addEventListener("focus",refresh);
   document.addEventListener("visibilitychange",onVisible);
   return ()=>{window.clearInterval(interval);window.removeEventListener("focus",refresh);document.removeEventListener("visibilitychange",onVisible);};
 },[]);

 // A profile's Message button selects its destination once. Polling must never
 // override the conversation the person subsequently chooses themselves.
 useEffect(()=>{
   if(role==="customer"&&targetOrganizationId)setSelectedKey(`organization:${targetOrganizationId}`);
 },[role,targetOrganizationId]);

 useEffect(()=>{
   if(!db){setError("No existe conexión con Supabase.");return;}
   let active=true;
   if(role==="business"&&!ownedIds.length){setThreads([]);setSelectedKey("");return;}
   const base=db.from("conversations").select("id,organization_id,customer_id,customer_display_name,created_at").order("created_at",{ascending:false});
   (role==="business"?base.in("organization_id",ownedIds):base.eq("customer_id",userId))
      .then(({data,error})=>{
        if(!active)return;
        if(error){setError(error.message);return;}
        const next=contextConversations((data||[]) as Conversation[],role,userId,ownedIds);
        setThreads(next);
        setSelectedKey(current=>{
          if(next.some(t=>conversationKey(t,role)===current))return current;
          if(role==="customer"&&targetOrganizationId&&current===`organization:${targetOrganizationId}`)return current;
          return next[0]?conversationKey(next[0],role):"";
        });
      });
   return ()=>{active=false;};
 },[db,role,ownedSignature,userId,targetOrganizationId,refreshId]);

 useEffect(()=>{
   const version=++messageLoadVersion.current;
   setLoadingOlder(false);
   if(!db||!selected){setLoadingMessages(false);return;}
   let active=true;
   setLoadingMessages(true);
   db.from("conversation_messages").select(messageFields).eq("conversation_id",selected)
     .order("created_at",{ascending:false}).order("id",{ascending:false}).limit(MESSAGE_PAGE_SIZE+1)
     .then(({data,error})=>{
       if(!active||messageLoadVersion.current!==version)return;
       setLoadingMessages(false);
       if(error){setError(error.message);return;}
       const page=((data||[]) as Message[]).slice(0,MESSAGE_PAGE_SIZE);
       setHistories(current=>{
         const previous=current[selected];
         const merged=mergeLatestMessages(previous?.messages||[],page);
         return {...current,[selected]:{
           messages:merged.messages,
           hasOlder:previous&&merged.contiguous?previous.hasOlder:(data?.length||0)>MESSAGE_PAGE_SIZE,
         }};
       });
     });
   return ()=>{active=false;};
 },[db,selected,refreshId]);

 // Keep the newest page in view without dragging someone away from older
 // messages they are reading. Prepending history preserves the scroll position.
 useLayoutEffect(()=>{
   const log=logRef.current;
   if(!log||!messages.length)return;
   const previous=scrollState.current;
   const first=messages[0].id,last=messages[messages.length-1].id;
   if(previous.thread===selected&&previous.last===last&&previous.first!==first){
     log.scrollTop+=log.scrollHeight-previous.height;
   }else if(previous.thread!==selected||previous.atBottom){
     log.scrollTop=log.scrollHeight;
   }
   const bottom=log.scrollHeight-log.scrollTop-log.clientHeight<48;
   scrollState.current={thread:selected,first,last,height:log.scrollHeight,atBottom:bottom};
   setAtBottom(bottom);
 },[selected,messages]);

 // Acknowledge data that has actually rendered, using the server's message
 // timestamp rather than this device's clock. Hidden tabs do not mark reads.
 useEffect(()=>{
   if(!db||!selected||!atBottom||document.visibilityState!=="visible")return;
   const cursor=latestReadCursor(messages);
   if(!cursor||laterReadCursor(readCursors.current[selected],cursor)!==cursor||readCursors.current[selected]===cursor)return;
   let active=true;
   const frame=window.requestAnimationFrame(()=>{
     if(!active||document.visibilityState!=="visible")return;
     void db.from("conversation_read_states").upsert({
       conversation_id:selected,user_id:userId,actor_role:role,read_at:cursor,
     },{onConflict:"conversation_id,user_id,actor_role"}).then(({error:readError})=>{
       if(!active)return;
       if(readError)setError("No se pudo actualizar el estado de lectura. "+readError.message);
       else {
         readCursors.current[selected]=laterReadCursor(readCursors.current[selected],cursor);
         setUnread(current=>({...current,[selected]:0}));
       }
     });
   });
   return ()=>{active=false;window.cancelAnimationFrame(frame);};
 },[db,selected,messages,role,userId,refreshId,atBottom]);

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
     const cutoff=new Map((reads.data||[]).map(v=>[v.conversation_id,Date.parse(v.read_at)]));
     const counts:Record<string,number>={};
     for(const m of msgs.data||[]){
       const last=Math.max(cutoff.get(m.conversation_id)||0,Date.parse(readCursors.current[m.conversation_id]||"")||0);
       if(Date.parse(m.created_at)>last)counts[m.conversation_id]=(counts[m.conversation_id]||0)+1;
     }
     setUnread(counts);
   });
   return ()=>{active=false;};
 },[db,threads,role,userId,refreshId]);

 async function loadOlder(){
   if(!db||!selected||!history?.hasOlder||loadingOlder||loadingMessages)return;
   const cursor=messages[0];
   if(!cursor)return;
   const version=messageLoadVersion.current;
   setLoadingOlder(true);setError("");
   try {
     const {data,error}=await db.from("conversation_messages").select(messageFields).eq("conversation_id",selected)
       .or(olderMessagesFilter(cursor)).order("created_at",{ascending:false}).order("id",{ascending:false}).limit(MESSAGE_PAGE_SIZE+1);
     if(!mounted.current||messageLoadVersion.current!==version)return;
     if(error)throw error;
     setHistories(current=>({...current,[selected]:{
       messages:chronologicalMessages([...(current[selected]?.messages||[]),...((data||[]) as Message[]).slice(0,MESSAGE_PAGE_SIZE)]),
       hasOlder:(data?.length||0)>MESSAGE_PAGE_SIZE,
     }}));
   }catch(e){if(mounted.current)setError(e instanceof Error?e.message:"No se pudo cargar el historial.");}
   finally{if(mounted.current&&messageLoadVersion.current===version)setLoadingOlder(false);}
 }

 async function send(event:FormEvent){
   event.preventDefault();
   const body=draft.trim(),sendingKey=selectedKey,sendingFile=file;
   if(!db||(!body&&!sendingFile)||body.length>2000||loading||(!selected&&!newTarget))return;
   setLoading(true);setError("");
   try {
     let threadId=selected;
     if(!threadId) {
       if(role!=="customer"||!newTarget)throw Error("Selecciona una conversación.");
       const {data:existing,error:readError}=await db.from("conversations").select("id")
         .eq("customer_id",userId).eq("organization_id",newTarget).maybeSingle();
       if(!mounted.current)return;
       if(readError)throw readError;
       if(existing?.id) threadId=existing.id;
       else {
         const {data:created,error:createError}=await db.from("conversations")
           .insert({organization_id:newTarget,customer_id:userId}).select("id").single();
         if(!mounted.current)return;
         if(createError)throw createError;
         threadId=created.id;
       }
     }
     let attachment_path="",attachment_name="",attachment_mime="",attachment_size:null|number=null;
     if(sendingFile){
       const types=["image/jpeg","image/png","image/webp","application/pdf","text/plain"];
       if(!types.includes(sendingFile.type))throw Error("Adjunta JPG, PNG, WebP, PDF o TXT.");
       if(sendingFile.size===0||sendingFile.size>10*1024*1024||sendingFile.name.length>120)throw Error("El archivo debe ocupar hasta 10 MB y su nombre hasta 120 caracteres.");
       const ext=({"image/jpeg":"jpg","image/png":"png","image/webp":"webp","application/pdf":"pdf","text/plain":"txt"} as Record<string,string>)[sendingFile.type];
       attachment_path=threadId+"/"+createUploadId()+"."+ext;
       attachment_name=sendingFile.name;attachment_mime=sendingFile.type;attachment_size=sendingFile.size;
       const {error:uploadError}=await db.storage.from("autonoservice-private-chat").upload(attachment_path,sendingFile,{contentType:sendingFile.type,upsert:false});
       if(uploadError)throw uploadError;
       if(!mounted.current){void db.storage.from("autonoservice-private-chat").remove([attachment_path]);return;}
     }
     const {error:messageError}=await db.from("conversation_messages").insert({
       conversation_id:threadId,sender_id:userId,actor_role:role,body,
       attachment_path,attachment_name,attachment_mime,attachment_size,
     });
     if(messageError){
       if(attachment_path)void db.storage.from("autonoservice-private-chat").remove([attachment_path]);
       throw messageError;
     }
     if(!mounted.current)return;
     setDrafts(current=>{
       const currentDraft=current[sendingKey];
       return currentDraft?.body===draft&&currentDraft.file===sendingFile
         ?{...current,[sendingKey]:EMPTY_DRAFT}:current;
     });
     // A completed send must not drag the user back from a different thread.
     if(selectedRef.current===sendingKey)refresh();
   }catch(e){if(mounted.current)setError(e instanceof Error?e.message:"No se ha podido enviar el mensaje.");}
   finally{if(mounted.current)setLoading(false);}
 }
 async function openAttachment(path:string){
   if(!db)return;
   setError("");
   const {data,error}=await db.storage.from("autonoservice-private-chat").createSignedUrl(path,60);
   if(!mounted.current)return;
   if(error||!data?.signedUrl){setError(error?.message||"No se pudo abrir el adjunto.");return;}
   window.location.assign(data.signedUrl);
 }
 const isActive=(t:Conversation)=>conversationKey(t,role)===selectedKey;
 return <section className="as-social-inbox" aria-label="Mensajes reales">
   <div className="as-social-inbox-intro">
     <div><span className="eyebrow">CONVERSACIONES</span><h2>Mensajes</h2><p>{role==="business"?"Conversaciones de tus negocios, reunidas en una sola bandeja.":"Tus conversaciones privadas con los negocios."} Se actualizan automáticamente.</p></div>
     <button type="button" className="button secondary" onClick={refresh}><RefreshCw size={15}/> Actualizar</button>
   </div>
   <div className="as-social-chat-grid">
    <aside className="as-social-thread-list" aria-label="Tus conversaciones">
      {threads.length===0&&!newTarget&&<div className="as-social-empty"><Inbox size={25}/><strong>Sin conversaciones todavía</strong><span>{role==="customer"?"Visita un negocio y pulsa «Mensaje» para escribirle.":"Las conversaciones aparecerán cuando alguien contacte con tu negocio."}</span></div>}
      {threads.map(thread=><button key={thread.id} type="button"
       className={isActive(thread)?"as-social-thread is-active":"as-social-thread"}
       onClick={()=>{setSelectedKey(conversationKey(thread,role));setError("");}}>
         <span className="as-social-thread-avatar"><MessageCircle size={17}/></span>
         <span><strong>{role==="business"?(thread.customer_display_name||"Cliente")+" · "+(organizations.find(o=>o.id===thread.organization_id)?.name||"Negocio"):
            organizations.find(o=>o.id===thread.organization_id)?.name||"Negocio"}</strong><small>Conversación privada {unread[thread.id]>0&&<b className="as-social-unread-count">{unread[thread.id]} sin leer</b>}</small></span>
       </button>)}
      {newTarget&&<button type="button" className="as-social-thread is-active" onClick={()=>setError("")}>
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
        <div ref={logRef} className="as-social-message-list" role="log" aria-live="polite" aria-busy={loadingMessages} onScroll={()=>{
           const log=logRef.current;if(!log)return;
           const bottom=log.scrollHeight-log.scrollTop-log.clientHeight<48;
           scrollState.current.atBottom=bottom;setAtBottom(bottom);
         }}>
         {history?.hasOlder&&<button type="button" className="button secondary small" onClick={loadOlder} disabled={loadingOlder}>{loadingOlder?"Cargando historial…":"Cargar mensajes anteriores"}</button>}
         {loadingMessages&&!messages.length&&<p role="status">Cargando conversación…</p>}
         {!loadingMessages&&messages.length===0&&<div className="as-social-empty"><MessageCircle size={23}/><strong>Inicia la conversación</strong><span>No se ha enviado ningún mensaje todavía.</span></div>}
         {messages.map(m=><div key={m.id} className={m.actor_role===role?"as-social-message mine":"as-social-message"}>
            <div className="as-social-message-meta">{m.actor_role===role?"Tú":m.actor_role==="business"?"Negocio":"Cliente"} · {new Date(m.created_at).toLocaleString("es-ES",{dateStyle:"short",timeStyle:"short"})}</div>
            {m.body&&<p>{m.body}</p>}
            {m.attachment_path&&<button type="button" className="as-social-file-button" onClick={()=>openAttachment(m.attachment_path)}>
              <Download size={14}/>{m.attachment_name||"Abrir archivo"}{m.attachment_size?" · "+Math.round(m.attachment_size/1024)+" KB":""}
            </button>}
          </div>)}
        </div>
        <form className="as-social-chat-compose" onSubmit={send} key={selectedKey}>
          <label htmlFor="live-message" className="sr-only">Tu mensaje</label>
          <div className="as-social-compose-fields"><textarea id="live-message" value={draft} onChange={e=>updateDraft({body:e.target.value})} maxLength={2000}
           placeholder="Escribe tu mensaje…" rows={2}/>
           <label className="as-social-attach-button"><Paperclip size={15}/>{file?file.name:"Adjuntar JPG, PNG, WebP, PDF o TXT"}
             <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf,text/plain" disabled={loading}
               onChange={e=>{updateDraft({file:e.target.files?.[0]||null});e.target.value="";}}/>
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
