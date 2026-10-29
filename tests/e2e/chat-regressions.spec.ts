import { expect, test } from "@playwright/test";
import {
  installSupabaseMock, MOCK_ORGANIZATION_ID, MOCK_USER_ID,
} from "./helpers/supabase";

const SECOND_ORG="55555555-5555-4555-8555-555555555555";
const FIRST_THREAD="66666666-6666-4666-8666-666666666666";
const SECOND_THREAD="77777777-7777-4777-8777-777777777777";
const OTHER_PERSON="88888888-8888-4888-8888-888888888888";
const company=(id:string,name:string,owner_id=OTHER_PERSON)=>({
  id,name,owner_id,category:"Fotografía",city:"Barcelona",description:"Perfil de prueba",
  tagline:"",accent_color:"#A47B53",avatar_url:"",cover_url:"",published:true,created_at:"2026-01-01T12:00:00Z",
});
const threads=[
  {id:FIRST_THREAD,organization_id:MOCK_ORGANIZATION_ID,customer_id:MOCK_USER_ID,customer_display_name:"Alex",created_at:"2026-10-29T12:01:00.000Z"},
  {id:SECOND_THREAD,organization_id:SECOND_ORG,customer_id:MOCK_USER_ID,customer_display_name:"Alex",created_at:"2026-10-29T12:00:00.000Z"},
];
const chatMessage=(number:number,conversation_id=FIRST_THREAD)=>({
  id:number.toString(16).padStart(8,"0")+"-0000-4000-8000-000000000000",conversation_id,
  sender_id:OTHER_PERSON,actor_role:"business",body:`Mensaje de prueba ${number}`,
  created_at:new Date(Date.UTC(2026,9,29,12,0,number)).toISOString(),
  attachment_path:"",attachment_name:"",attachment_mime:"",attachment_size:null,
});

// These tests exercise real React screens with a synthetic HTTP transport.
// They do not connect to a project or certify PostgreSQL authorization.
test("el chat abre los mensajes recientes, pagina el historial y lee hasta el último mensaje cargado",async({page})=>{
  const recent=Array.from({length:215},(_,index)=>chatMessage(index+1));
  const mock=await installSupabaseMock(page,{tables:{
    organizations:[company(MOCK_ORGANIZATION_ID,"Negocio Alfa")],
    conversations:[threads[0]],conversation_messages:recent,
  }});
  await page.goto("/cliente");
  await page.getByRole("navigation",{name:"Navegación Cliente"}).getByRole("button",{name:"Mensajes",exact:true}).click();
  const log=page.getByRole("log");
  await expect(log.getByText("Mensaje de prueba 215",{exact:true})).toBeVisible();
  await expect(log.getByText("Mensaje de prueba 1",{exact:true})).toHaveCount(0);
  await expect.poll(()=>mock.requests.filter(r=>r.method==="POST"&&new URL(r.url).pathname.endsWith("/conversation_read_states")).map(r=>(r.body as {read_at:string}).read_at)).toContain(recent.at(-1)!.created_at);
  await page.getByRole("button",{name:"Cargar mensajes anteriores",exact:true}).click();
  await expect(log.getByText("Mensaje de prueba 1",{exact:true})).toBeVisible();
  await expect(log.getByText("Mensaje de prueba 215",{exact:true})).toBeVisible();
  await expect(page.getByRole("button",{name:"Cargar mensajes anteriores",exact:true})).toHaveCount(0);
});

test("el refresco conserva el destinatario y los borradores de cada conversación",async({page})=>{
  await page.clock.install();
  const mock=await installSupabaseMock(page,{tables:{
    organizations:[company(MOCK_ORGANIZATION_ID,"Negocio Alfa"),company(SECOND_ORG,"Negocio Beta")],
    conversations:threads,conversation_messages:[chatMessage(1),chatMessage(2,SECOND_THREAD)],
  }});
  await page.goto("/cliente");
  await page.locator(".as-social-business-card").filter({hasText:"Negocio Alfa"}).getByRole("button",{name:"Mensaje",exact:true}).click();
  await expect(page.locator(".as-social-chat-heading")).toContainText("Negocio Alfa");
  await page.getByRole("complementary",{name:"Tus conversaciones"}).getByRole("button").filter({hasText:"Negocio Beta"}).click();
  const compose=page.getByRole("textbox",{name:"Tu mensaje",exact:true});
  await compose.fill("Este mensaje es para Beta");
  await page.locator('.as-social-chat-compose input[type="file"]').setInputFiles({name:"beta.txt",mimeType:"text/plain",buffer:Buffer.from("Solo para Beta")});
  await page.clock.runFor(6500);
  await expect(page.locator(".as-social-chat-heading")).toContainText("Negocio Beta");
  await expect(compose).toHaveValue("Este mensaje es para Beta");
  await page.getByRole("complementary",{name:"Tus conversaciones"}).getByRole("button").filter({hasText:"Negocio Alfa"}).click();
  await expect(compose).toHaveValue("");
  await expect(page.locator(".as-social-attach-button")).not.toContainText("beta.txt");
  await page.getByRole("complementary",{name:"Tus conversaciones"}).getByRole("button").filter({hasText:"Negocio Beta"}).click();
  await expect(compose).toHaveValue("Este mensaje es para Beta");
  await expect(page.locator(".as-social-attach-button")).toContainText("beta.txt");
  await page.locator('.as-social-chat-compose input[type="file"]').setInputFiles([]);
  await page.getByRole("button",{name:"Enviar",exact:true}).click();
  await expect.poll(()=>mock.requests.filter(r=>r.method==="POST"&&new URL(r.url).pathname.endsWith("/conversation_messages")).map(r=>(r.body as {conversation_id:string}).conversation_id)).toEqual([SECOND_THREAD]);
});

test("Empresa no mezcla conversaciones personales de una identidad con ambos espacios",async({page})=>{
  const customerThread={...threads[0],customer_id:OTHER_PERSON,customer_display_name:"Cliente del negocio"};
  const mock=await installSupabaseMock(page,{tables:{
    organizations:[company(MOCK_ORGANIZATION_ID,"Mi estudio",MOCK_USER_ID),company(SECOND_ORG,"Otro negocio")],
    conversations:[customerThread,threads[1]],conversation_messages:[{...chatMessage(1),sender_id:MOCK_USER_ID}],
  }});
  await page.goto("/empresa");
  await page.getByRole("navigation",{name:"Módulos disponibles"}).getByRole("button",{name:"Mensajes",exact:true}).click();
  const list=page.getByRole("complementary",{name:"Tus conversaciones"});
  await expect(list.getByRole("button")).toHaveCount(1);
  await expect(list).toContainText("Cliente del negocio");
  await expect(list).not.toContainText("Otro negocio");
  expect(mock.requests.filter(r=>r.method==="GET"&&new URL(r.url).pathname.endsWith("/conversations")).every(r=>new URL(r.url).searchParams.get("organization_id")===`in.(${MOCK_ORGANIZATION_ID})`)).toBe(true);
});
