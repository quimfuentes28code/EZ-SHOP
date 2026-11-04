import { expect, test, type Page } from "@playwright/test";
import { installSupabaseMock, MOCK_ORGANIZATION_ID, MOCK_USER_ID } from "./helpers/supabase";
import { installLeafletMock } from "./helpers/leaflet";

const navigation=(page:Page)=>page.getByRole("navigation",{name:"Navegación Cliente",exact:true});
const go=(page:Page,name:string)=>navigation(page).getByRole("button",{name,exact:true}).click();
const other="55555555-5555-4555-8555-555555555555";
const post=(id:string,organization_id:string,body:string)=>({id,organization_id,body,media_url:"",media_kind:null,published:true,created_at:"2026-10-31T12:00:00Z"});

test("Cliente móvil tiene cinco destinos fijos y cada uno conserva acceso a su contenido",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await installSupabaseMock(page);
  await installLeafletMock(page);
  await page.goto("/cliente");
  await expect(navigation(page).getByRole("button")).toHaveText(["Explorar","Mapa","Favoritos","Mensajes","Perfil"]);
  await expect(page.getByRole("heading",{name:/Encuentra lo que necesitas/})).toBeVisible();
  await go(page,"Mapa");await expect(page.getByRole("heading",{name:"Explora tiendas en el mapa.",exact:true})).toBeVisible();
  await go(page,"Favoritos");await expect(page.getByRole("heading",{name:"Los negocios que te gustan.",exact:true})).toBeVisible();
  await go(page,"Mensajes");await expect(page.getByRole("heading",{name:"Mensajes",exact:true,level:1})).toBeVisible();
  await go(page,"Perfil");await expect(page.getByRole("heading",{name:"Perfil",exact:true})).toBeVisible();
  await page.getByRole("button",{name:"Configuración y cuenta",exact:false}).click();
  await page.getByRole("button",{name:"Cerrar sesión",exact:true}).scrollIntoViewIfNeeded();
  const button=await page.getByRole("button",{name:"Cerrar sesión",exact:true}).boundingBox();
  const bar=await navigation(page).boundingBox();
  expect(button).not.toBeNull();expect(bar).not.toBeNull();
  expect(button!.y+button!.height).toBeLessThanOrEqual(bar!.y);
  expect(bar!.y+bar!.height).toBeLessThanOrEqual(845);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test("Siguiendo reutiliza favoritos, Para ti muestra contenido real y Cerca de mí solo sedes publicadas",async({page})=>{
  const mock=await installSupabaseMock(page);
  mock.tables.organizations.push({...mock.tables.organizations[0],id:other,name:"Otro negocio QA",city:"Barcelona"});
  mock.tables.business_posts.push(post("post-a",MOCK_ORGANIZATION_ID,"Novedad del negocio guardado"),post("post-b",other,"Novedad de otra empresa"));
  mock.tables.customer_favorites.push({customer_id:MOCK_USER_ID,organization_id:MOCK_ORGANIZATION_ID});
  mock.tables.organization_locations[0].latitude=41.56;mock.tables.organization_locations[0].longitude=2.01;
  await page.goto("/cliente");
  await expect(page.getByRole("heading",{name:"Publicaciones recientes",exact:true})).toBeVisible();
  await expect(page.getByText("Novedad del negocio guardado",{exact:true})).toBeVisible();
  await expect(page.getByText("Novedad de otra empresa",{exact:true})).toBeVisible();
  const feeds=page.getByRole("navigation",{name:"Contenido de Explorar",exact:true});
  await feeds.getByRole("button",{name:"Siguiendo",exact:true}).click();
  await expect(page.getByText("Novedad del negocio guardado",{exact:true})).toBeVisible();
  await expect(page.getByText("Novedad de otra empresa",{exact:true})).toHaveCount(0);
  await feeds.getByRole("button",{name:"Cerca de mí",exact:true}).click();
  await expect(page.locator(".as-social-business-card")).toHaveCount(1);
  await expect(page.locator(".as-social-business-card")).toContainText("Estudio de prueba");
  await go(page,"Favoritos");
  await expect(page.locator(".as-social-business-card")).toHaveCount(1);
  await page.getByRole("button",{name:"Quitar de favoritos",exact:true}).click();
  await go(page,"Explorar");
  await feeds.getByRole("button",{name:"Siguiendo",exact:true}).click();
  await expect(page.getByText("Novedad del negocio guardado",{exact:true})).toHaveCount(0);
  expect(mock.requests.filter(request=>request.method==="DELETE"&&request.url.includes("customer_favorites"))).toHaveLength(1);
});

test("los enlaces antiguos de actividad y novedades abren su nuevo apartado sin perder datos",async({page})=>{
  const mock=await installSupabaseMock(page,{tables:{service_requests:[{
    id:"activity-a",customer_id:MOCK_USER_ID,organization_id:MOCK_ORGANIZATION_ID,service_id:"33333333-3333-4333-8333-333333333333",notes:"Actividad conservada QA",status:"accepted",requested_date:"2026-11-12",created_at:"2026-10-31T12:00:00Z",
  }]}});
  mock.tables.business_posts.push(post("post-followed",MOCK_ORGANIZATION_ID,"Publicación seguida QA"));
  mock.tables.customer_favorites.push({customer_id:MOCK_USER_ID,organization_id:MOCK_ORGANIZATION_ID});
  await page.goto("/cliente?vista=actividad");
  await expect(navigation(page).getByRole("button",{name:"Perfil",exact:true})).toHaveAttribute("aria-current","page");
  await expect(page.getByRole("heading",{name:"Mi actividad",exact:true})).toBeVisible();
  await expect(page.getByText("Actividad conservada QA",{exact:false})).toBeVisible();
  await expect(page.locator(".as-social-request-state")).toHaveText("Aceptada");
  await page.goto("/cliente?vista=novedades");
  await expect(navigation(page).getByRole("button",{name:"Explorar",exact:true})).toHaveAttribute("aria-current","page");
  await expect(page.getByRole("navigation",{name:"Contenido de Explorar"}).getByRole("button",{name:"Siguiendo",exact:true})).toHaveAttribute("aria-current","page");
  await expect(page.getByText("Publicación seguida QA",{exact:true})).toBeVisible();
});

test("buscar, mapa y perfil comercial conservan filtros y no duplican navegación sobre el diálogo",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  const mock=await installSupabaseMock(page);
  mock.tables.organization_locations[0].latitude=41.56;mock.tables.organization_locations[0].longitude=2.01;
  await installLeafletMock(page);
  await page.goto("/cliente");
  await page.getByRole("textbox",{name:"Buscar negocios o servicios",exact:true}).fill("retrato");
  await page.getByRole("textbox",{name:"Filtrar por localidad",exact:true}).fill("Terrassa");
  await go(page,"Favoritos");await go(page,"Explorar");
  await expect(page.getByRole("textbox",{name:"Buscar negocios o servicios",exact:true})).toHaveValue("retrato");
  await expect(page.getByRole("textbox",{name:"Filtrar por localidad",exact:true})).toHaveValue("Terrassa");
  await go(page,"Mapa");
  await page.getByTestId("map-marker").click();
  await expect(page.getByRole("dialog")).toContainText("Estudio de prueba");
  await expect(navigation(page)).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(navigation(page)).toBeVisible();
  await expect(navigation(page).getByRole("button",{name:"Mapa",exact:true})).toHaveAttribute("aria-current","page");
  await expect(page.getByRole("textbox",{name:"Filtrar por localidad",exact:true})).toHaveValue("Terrassa");
});

test("Mensajes conserva el borrador y el adjunto al pasar por otra sección",async({page})=>{
  const thread="66666666-6666-4666-8666-666666666666";
  await installSupabaseMock(page,{tables:{conversations:[{id:thread,organization_id:MOCK_ORGANIZATION_ID,customer_id:MOCK_USER_ID,customer_display_name:"Alex",created_at:"2026-10-31T12:00:00Z"}],conversation_messages:[{id:"message-a",conversation_id:thread,sender_id:MOCK_USER_ID,actor_role:"customer",body:"Mensaje previo",created_at:"2026-10-31T12:01:00Z",attachment_path:"",attachment_name:"",attachment_mime:"",attachment_size:null}]}});
  await page.goto("/cliente");await go(page,"Mensajes");
  const compose=page.getByRole("textbox",{name:"Tu mensaje",exact:true});
  await compose.fill("Borrador que debe conservarse");
  await page.locator('.as-social-chat-compose input[type="file"]').setInputFiles({name:"borrador.txt",mimeType:"text/plain",buffer:Buffer.from("Archivo aún sin enviar")});
  await go(page,"Perfil");await go(page,"Mensajes");
  await expect(compose).toHaveValue("Borrador que debe conservarse");
  await expect(page.locator(".as-social-attach-button")).toContainText("borrador.txt");
});
