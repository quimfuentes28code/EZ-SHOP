"use client";

import { useEffect, useState, type FormEvent } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { MessageCircle, Send, RefreshCw, ShieldCheck, Inbox } from "lucide-react";

type Org = { id:string; name:string };
type Conversation = { id:string; organization_id:string; customer_id:string; created_at:string };
type Message = { id:string; conversation_id:string; sender_id:string; actor_role:"customer"|"business"; body:string; created_at:string };

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
 const [error,setError]=useState("");
 const [loading,setLoading]=useState(false);
 const [refreshId,setRefreshId]=useState(0);
 const [threadLabel,setThreadLabel]=useState("");
 const refresh=()=>setRefreshId(n=>n+1);

 useEffect(()=>{
   if(!db){setError("No existe conexión con Supabase.");return;}
   let active=true;
   const base=db.from("conversations").select("id,organization_id,customer_id,created_at").order("created_at",{ascending:false});
   (role==="business"?base.eq("organization_id",organizationId||"00000000-0000-0000-0000-000000000000"):base.eq("customer_id",userId))
      .then(({data,error})=>{
        if(!active)return;
        if(error){setError(error.message);return;}
        const next=(data||[]) as Conversation[];
        setThreads(next);
        setSelected(id=>next.some(t=>t.id===id)?id:
          role==="customer" && targetOrganizationId
          ?(next.find(t=>t.organization_id===targetOrganizationId)?.id||"")
          :(next[0]?.id||""));
      });
   return ()=>{active=false;};
 },[db,role,organizationId,userId,targetOrganizationId,refreshId]);

 useEffect(()=>{
   if(!db||!selected){setMessages([]);return;}
   let active=true;
   db.from("conversation_messages").select("id,conversation_id,sender_id,actor_role,body,created_at")
     .eq("conversation_id",selected).order("created_at",{ascending:true}).limit(200)
     .then(({data,error})=>{
       if(!active)return;
       if(error){setError(error.message);return;}
       setMessages((data||[]) as Message[]);
     });
   return ()=>{active=false;};
 },[db,selected,refreshId]);

 const activeThread=threads.find(t=>t.id===selected);
 const pendingOrg=role==="customer" && !!targetOrganizationId && !threads.some(t=>t.organization_id===targetOrganizationId);
 const newTarget=pendingOrg?targetOrganizationId:null;
 const currentCompany=activeThread?.organization_id||newTarget||organizationId||"";
 const label=organizations.find(o=>o.id===currentCompany)?.name||"Conversación privada";

 useEffect(()=>{setThreadLabel(label);},[label]);

 async function send(event:FormEvent){
   event.preventDefault();
   const body=draft.trim();
   if(!db||!body||body.length>2000||loading)return;
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
     const {error:messageError}=await db.from("conversation_messages").insert({
       conversation_id:threadId,sender_id:userId,actor_role:role,body
     });
     if(messageError)throw messageError;
     setDraft("");setSelected(threadId);refresh();
   } catch(e){setError(e instanceof Error?e.message:"No se ha podido enviar el mensaje.");}
   finally {setLoading(false);}
 }
 const isActive=(t:Conversation)=>t.id===selected;
 return <section className="as-social-inbox" aria-label="Mensajes reales">
   <div className="as-social-inbox-intro">
     <div><span className="eyebrow">CONVERSACIONES</span><h2>Mensajes</h2><p>Habla directamente con negocios y clientes, en tu espacio privado.</p></div>
     <button type="button" className="button secondary" onClick={refresh}><RefreshCw size={15}/> Actualizar</button>
   </div>
   <div className="as-social-chat-grid">
    <aside className="as-social-thread-list" aria-label="Tus conversaciones">
      {threads.length===0&&!newTarget&&<div className="as-social-empty"><Inbox size={25}/><strong>Sin conversaciones todavía</strong><span>{role==="customer"?"Visita un negocio y pulsa «Mensaje» para escribirle.":"Las conversaciones aparecerán cuando alguien contacte con tu negocio."}</span></div>}
      {threads.map(thread=><button key={thread.id} type="button"
       className={isActive(thread)?"as-social-thread is-active":"as-social-thread"}
       onClick={()=>{setSelected(thread.id);setError("");}}>
         <span className="as-social-thread-avatar"><MessageCircle size={17}/></span>
         <span><strong>{role==="business"?"Cliente · "+thread.customer_id.slice(0,8):
            organizations.find(o=>o.id===thread.organization_id)?.name||"Negocio"}</strong><small>Conversación privada</small></span>
       </button>)}
      {newTarget&&<button type="button" className="as-social-thread is-active" onClick={()=>setSelected("")}>
        <span className="as-social-thread-avatar"><MessageCircle size={17}/></span>
        <span><strong>{organizations.find(o=>o.id===newTarget)?.name||"Nuevo mensaje"}</strong><small>Iniciar conversación</small></span>
      </button>}
    </aside>
    <div className="as-social-chat-main">
       {(activeThread||newTarget)?<>
        <div className="as-social-chat-heading"><span className="as-social-thread-avatar"><MessageCircle size={17}/></span>
         <div><strong>{role==="business"?"Conversación con un cliente":threadLabel}</strong>
          <small><ShieldCheck size={12}/> Solo participantes autorizados</small>
         </div></div>
        <div className="as-social-message-list" role="log" aria-live="polite">
         {messages.length===0&&<div className="as-social-empty"><MessageCircle size={23}/><strong>Inicia la conversación</strong><span>No se ha enviado ningún mensaje todavía.</span></div>}
         {messages.map(m=><div key={m.id} className={m.actor_role===role?"as-social-message mine":"as-social-message"}>
            <div className="as-social-message-meta">{m.actor_role===role?"Tú":m.actor_role==="business"?"Negocio":"Cliente"} · {new Date(m.created_at).toLocaleString("es-ES",{dateStyle:"short",timeStyle:"short"})}</div>
            <p>{m.body}</p>
          </div>)}
        </div>
        <form className="as-social-chat-compose" onSubmit={send}>
          <label htmlFor="live-message" className="sr-only">Tu mensaje</label>
          <textarea id="live-message" value={draft} onChange={e=>setDraft(e.target.value)} maxLength={2000}
           placeholder="Escribe tu mensaje…" rows={2} required/>
          <button className="button primary" type="submit" disabled={loading||!draft.trim()}>
            <Send size={15}/> Enviar
          </button>
        </form>
       </>:<div className="as-social-empty"><MessageCircle size={26}/><strong>Selecciona una conversación</strong><span>Aquí podrás hablar directamente con un negocio o con un cliente.</span></div>}
    </div>
   </div>
   {error&&<p className="live-alert" role="alert">{error}</p>}
   <p className="as-social-privacy-note"><ShieldCheck size={14}/> Solo texto por ahora. Los archivos, las notificaciones inmediatas y los controles avanzados contra mensajes no solicitados llegarán después.</p>
 </section>;
}
