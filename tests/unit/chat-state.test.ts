import assert from "node:assert/strict";
import { test } from "node:test";
import {
  chronologicalMessages, contextConversations, conversationKey,
  laterReadCursor, latestReadCursor, mergeLatestMessages, olderMessagesFilter,
} from "../../src/lib/conversation-state";

const a={id:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",organization_id:"business-a",customer_id:"person"};
const b={id:"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",organization_id:"business-b",customer_id:"person"};
const c={id:"cccccccc-cccc-4ccc-8ccc-cccccccccccc",organization_id:"business-a",customer_id:"another-person"};
const message=(n:number)=>({id:n.toString(16).padStart(8,"0")+"-0000-4000-8000-000000000000",created_at:new Date(Date.UTC(2026,9,29,12,0,n)).toISOString(),body:`Mensaje ${n}`});

test("la bandeja Empresa solo incluye negocios propios aunque la identidad también sea Cliente",()=>{
  assert.deepEqual(contextConversations([a,b,c],"business","person",["business-a"]),[a,c]);
  assert.deepEqual(contextConversations([a,b,c],"business","person",[]),[]);
  assert.deepEqual(contextConversations([a,b,c],"customer","person",[]),[a,b]);
});

test("el borrador Cliente mantiene su destino cuando una conversación nueva recibe ID",()=>{
  assert.equal(conversationKey(a,"customer"),"organization:business-a");
  assert.equal(conversationKey({...a,id:"new-server-id"},"customer"),conversationKey(a,"customer"));
  assert.notEqual(conversationKey(a,"customer"),conversationKey(b,"customer"));
  assert.notEqual(conversationKey(a,"business"),conversationKey(c,"business"));
});

test("el refresco conserva historial, añade mensajes nuevos y elimina duplicados",()=>{
  const existing=[message(1),message(2),message(3)];
  const recent=[message(4),message(3)];
  const result=mergeLatestMessages(existing,recent);
  assert.equal(result.contiguous,true);
  assert.deepEqual(result.messages,[message(1),message(2),message(3),message(4)]);
  assert.deepEqual(chronologicalMessages([...recent,...existing]),result.messages);
});

test("un intervalo sin solapamiento recupera el historial desde la última página sin dejar huecos silenciosos",()=>{
  const result=mergeLatestMessages([message(1),message(2)],[message(215),message(214)]);
  assert.equal(result.contiguous,false);
  assert.deepEqual(result.messages,[message(214),message(215)]);
});

test("el cursor de lectura procede del mensaje cargado y nunca del reloj del dispositivo",()=>{
  assert.equal(latestReadCursor([message(215),message(4)]),message(215).created_at);
  assert.equal(latestReadCursor([]),null);
  assert.equal(latestReadCursor([{id:"invalid",created_at:"no es fecha"}]),null);
  assert.equal(laterReadCursor(message(215).created_at,message(4).created_at),message(215).created_at);
  assert.equal(laterReadCursor("2026-10-29T12:00:00.123456Z","2026-10-29T12:00:00.123123+00:00"),"2026-10-29T12:00:00.123456Z");
});

test("la paginación preserva empates y microsegundos sin permitir inyección en filtros",()=>{
  const cursor={id:a.id,created_at:"2026-10-29T12:00:00.123456+00:00"};
  assert.equal(olderMessagesFilter(cursor),`created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${a.id})`);
  assert.throws(()=>olderMessagesFilter({...cursor,id:"invalid,or(id.not.is.null)"}));
  assert.throws(()=>olderMessagesFilter({...cursor,created_at:"2026-10-29),id.not.is.null"}));
});
