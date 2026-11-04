import { expect, test, type Page } from "@playwright/test";
import { installSupabaseMock, MOCK_ORGANIZATION_ID, MOCK_USER_ID } from "./helpers/supabase";

const mobileNav=(page:Page)=>page.getByRole("navigation",{name:"Navegación Empresa",exact:true});
const account=(page:Page)=>page.locator(".app-account-actions");

test("Empresa móvil conserva cinco destinos y todas las herramientas en Gestión",async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await installSupabaseMock(page);
 await page.goto("/empresa");
 const navigation=mobileNav(page);
 await expect(navigation.getByRole("button")).toHaveText(["Inicio","Agenda","Mensajes","Gestión","Perfil"]);
 await navigation.getByRole("button",{name:"Agenda",exact:true}).click();
 await expect(page.getByRole("heading",{name:"Organiza tu trabajo",exact:true})).toBeVisible();
 await expect(page.getByRole("navigation",{name:"Herramientas de gestión"}).getByRole("button",{name:/Agenda interna/})).toHaveClass(/active/);
 await navigation.getByRole("button",{name:"Gestión",exact:true}).click();
 const hub=page.getByRole("region",{name:"Gestión de tu negocio"});
 for(const label of ["Clientes","Servicios","Solicitudes","Tiendas y sedes","Proyectos y agenda","Herramientas"]){
  await expect(hub.getByRole("button",{name:new RegExp("^"+label)})).toBeVisible();
 }
 await hub.getByRole("button",{name:/^Clientes/}).click();
 await expect(page.getByRole("heading",{name:"Clientes de Estudio de prueba",exact:true})).toBeVisible();
 await expect(navigation.getByRole("button",{name:"Gestión",exact:true})).toHaveAttribute("aria-current","page");
 await page.getByRole("button",{name:"Gestión",exact:true}).first().click();
 await hub.getByRole("button",{name:/^Herramientas/}).click();
 await expect(page.getByRole("heading",{name:"Todas las herramientas",exact:true})).toBeVisible();
 await navigation.getByRole("button",{name:"Perfil",exact:true}).click();
 await expect(page.getByRole("navigation",{name:"Editar perfil público"})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test("Agenda mantiene el borrador al cambiar de apartado y la cuenta queda separada del escaparate",async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await installSupabaseMock(page);
 await page.goto("/empresa");
 const navigation=mobileNav(page);
 await navigation.getByRole("button",{name:"Agenda",exact:true}).click();
 await page.getByLabel("Título",{exact:true}).fill("Planificación sin guardar");
 await navigation.getByRole("button",{name:"Inicio",exact:true}).click();
 await navigation.getByRole("button",{name:"Agenda",exact:true}).click();
 await expect(page.getByLabel("Título",{exact:true})).toHaveValue("Planificación sin guardar");
 await account(page).locator("summary").click();
 await account(page).getByRole("button",{name:"Mi cuenta y configuración",exact:true}).click();
 await expect(page.getByRole("heading",{name:"Mis datos personales",exact:true})).toBeVisible();
 await expect(page.getByLabel("Nombre comercial",{exact:true})).toHaveCount(0);
 await navigation.getByRole("button",{name:"Perfil",exact:true}).click();
 await expect(page.getByLabel("Nombre comercial",{exact:true})).toBeVisible();
 await expect(page.getByRole("heading",{name:"Mis datos personales",exact:true})).toHaveCount(0);
});

test("un presupuesto conserva tipo e importe al salir de Agenda y se guarda como presupuesto",async({page})=>{
 await page.setViewportSize({width:390,height:844});
 const {tables}=await installSupabaseMock(page);
 await page.goto("/empresa");
 const navigation=mobileNav(page);
 await navigation.getByRole("button",{name:"Agenda",exact:true}).click();
 const kinds=page.getByRole("navigation",{name:"Herramientas de gestión",exact:true});
 await expect(kinds.getByRole("button",{name:/Agenda interna/})).toHaveClass(/active/);
 const quotes=kinds.getByRole("button",{name:/Presupuestos borrador/});
 await quotes.click();
 await page.getByLabel("Título",{exact:true}).fill("Presupuesto conservado QA");
 await page.getByLabel("Importe aproximado (€)",{exact:true}).fill("125.50");
 await page.getByRole("textbox",{name:"Notas y descripción",exact:true}).fill("Encargo pendiente de confirmar");
 await navigation.getByRole("button",{name:"Inicio",exact:true}).click();
 await navigation.getByRole("button",{name:"Agenda",exact:true}).click();
 await expect(quotes).toHaveClass(/active/);
 await expect(page.getByLabel("Título",{exact:true})).toHaveValue("Presupuesto conservado QA");
 await expect(page.getByLabel("Importe aproximado (€)",{exact:true})).toHaveValue("125.50");
 await expect(page.getByRole("textbox",{name:"Notas y descripción",exact:true})).toHaveValue("Encargo pendiente de confirmar");
 await page.getByRole("button",{name:"Crear registro",exact:true}).click();
 await expect.poll(()=>tables.business_work_items.length).toBe(1);
 expect(tables.business_work_items[0]).toMatchObject({organization_id:MOCK_ORGANIZATION_ID,kind:"quote",title:"Presupuesto conservado QA",amount_eur:125.5,details:"Encargo pendiente de confirmar"});
 await page.reload();
 await quotes.click();
 await expect(page.locator(".workboard-item")).toContainText("Presupuesto conservado QA");
 await expect(page.locator(".workboard-item")).toContainText("125,50");
});

for(const legacy of ["mensajes","diseno"] as const){
 test(`el enlace antiguo tab=${legacy} permite navegar y recargar el destino actual`,async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await installSupabaseMock(page);
  await page.goto(`/empresa?tab=${legacy}`);
  const navigation=mobileNav(page);
  await expect(navigation.getByRole("button",{name:legacy==="mensajes"?"Mensajes":"Perfil",exact:true})).toHaveAttribute("aria-current","page");
  if(legacy==="diseno"){
   await expect(page.getByRole("heading",{name:"Organizar perfil público",exact:true})).toBeVisible();
   await page.getByRole("navigation",{name:"Editar perfil público",exact:true}).getByRole("button",{name:"Información general",exact:true}).click();
   await expect(page).toHaveURL(/\/empresa\?seccion=perfil$/);
   await page.reload();
   await expect(page.getByLabel("Nombre comercial",{exact:true})).toBeVisible();
  }
  const previous=page.url();
  await navigation.getByRole("button",{name:"Inicio",exact:true}).click();
  await expect(page).toHaveURL(/\/empresa$/);
  await page.reload();
  await expect(navigation.getByRole("button",{name:"Inicio",exact:true})).toHaveAttribute("aria-current","page");
  await page.goBack();
  await expect(page).toHaveURL(previous);
  await expect(navigation.getByRole("button",{name:legacy==="mensajes"?"Mensajes":"Perfil",exact:true})).toHaveAttribute("aria-current","page");
  await page.goForward();
  await expect(page).toHaveURL(/\/empresa$/);
  await expect(navigation.getByRole("button",{name:"Inicio",exact:true})).toHaveAttribute("aria-current","page");
 });
}

test("escritorio agrupa la navegación y los enlaces de diseño antiguos abren el editor único",async({page})=>{
 await installSupabaseMock(page);
 await page.goto("/empresa?editor=diseno");
 const desktop=page.getByRole("navigation",{name:"Módulos disponibles"});
 for(const name of ["Inicio","Agenda","Mensajes","Gestión","Perfil público","Herramientas"]){
  await expect(desktop.getByRole("heading",{name,exact:true})).toBeVisible();
 }
 await expect(desktop.getByRole("button",{name:"Diseño del perfil",exact:true})).toHaveCount(0);
 await expect(page.getByRole("heading",{name:"Organizar perfil público",exact:true})).toBeVisible();
 await expect(page.locator(".social-business-editor")).toHaveCount(1);
 await expect(mobileNav(page)).toBeHidden();
 await page.getByRole("navigation",{name:"Editar perfil público"}).getByRole("button",{name:"Información general",exact:true}).click();
 await expect(page.getByLabel("Nombre comercial",{exact:true})).toBeVisible();
 await page.goBack();
 await expect(page.getByRole("heading",{name:"Organizar perfil público",exact:true})).toBeVisible();
 await page.reload();
 await expect(page.getByRole("heading",{name:"Organizar perfil público",exact:true})).toBeVisible();
});

test("el selector único actualiza la empresa activa desde cualquier apartado",async({page})=>{
 const second="55555555-5555-4555-8555-555555555555";
 await page.setViewportSize({width:390,height:844});
 await installSupabaseMock(page,{tables:{organizations:[
  {id:MOCK_ORGANIZATION_ID,owner_id:MOCK_USER_ID,name:"Empresa A",category:"Fotografía",city:"Barcelona",description:"Perfil A",published:true,created_at:"2026-01-02"},
  {id:second,owner_id:MOCK_USER_ID,name:"Empresa B",category:"Belleza",city:"Terrassa",description:"Perfil B",published:true,created_at:"2026-01-01"},
 ]}});
 await page.goto("/empresa");
 await mobileNav(page).getByRole("button",{name:"Agenda",exact:true}).click();
 await expect(page.getByRole("navigation",{name:"Herramientas de gestión",exact:true}).getByRole("button",{name:/Agenda interna/})).toHaveClass(/active/);
 await mobileNav(page).getByRole("button",{name:"Inicio",exact:true}).click();
 await mobileNav(page).getByRole("button",{name:"Perfil",exact:true}).click();
 const selection=page.getByRole("combobox",{name:"Cambiar de empresa activa",exact:true});
 await expect(selection).toHaveCount(1);
 await selection.selectOption(second);
 await expect(page.getByRole("heading",{name:"Perfil de Empresa B",exact:true})).toBeVisible();
 await expect(page.getByLabel("Nombre comercial",{exact:true})).toHaveValue("Empresa B");
 await expect(page.getByRole("textbox",{name:"Descripción del negocio",exact:true})).toHaveValue("Perfil B");
 await mobileNav(page).getByRole("button",{name:"Gestión",exact:true}).click();
 await expect(selection).toHaveValue(second);
 await mobileNav(page).getByRole("button",{name:"Agenda",exact:true}).click();
 await expect(page.getByRole("navigation",{name:"Herramientas de gestión",exact:true}).getByRole("button",{name:/Agenda interna/})).toHaveClass(/active/);
});
