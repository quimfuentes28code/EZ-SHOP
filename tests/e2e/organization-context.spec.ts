import { expect, test } from "@playwright/test";
import { installSupabaseMock, MOCK_ORGANIZATION_ID, MOCK_SUPABASE_URL, MOCK_USER_ID } from "./helpers/supabase";

const second="55555555-5555-4555-8555-555555555555";
const organizations=[
  {id:MOCK_ORGANIZATION_ID,owner_id:MOCK_USER_ID,name:"Empresa A",category:"Fotografía",city:"Barcelona",description:"Empresa de prueba A",published:false,tagline:"",accent_color:"#A47B53",avatar_url:"",cover_url:"",created_at:"2026-01-02T12:00:00Z"},
  {id:second,owner_id:MOCK_USER_ID,name:"Empresa B",category:"Fotografía",city:"Terrassa",description:"Empresa de prueba B",published:false,tagline:"",accent_color:"#A47B53",avatar_url:"",cover_url:"",created_at:"2026-01-01T12:00:00Z"},
];
const modules=(page:import("@playwright/test").Page)=>page.getByRole("navigation",{name:"Módulos disponibles"});

test("cambiar de empresa limpia los datos anteriores e ignora respuestas tardías",async({page})=>{
  await installSupabaseMock(page,{tables:{
    organizations,
    organization_services:[
      {id:"service-a",organization_id:MOCK_ORGANIZATION_ID,title:"Servicio exclusivo A",price_eur:50,active:true},
      {id:"service-b",organization_id:second,title:"Servicio exclusivo B",price_eur:60,active:true},
    ],
    organization_customers:[
      {customer_id:"contact-a",organization_id:MOCK_ORGANIZATION_ID,display_name:"Contacto exclusivo A",email:"a@example.test",phone:"",city:"Barcelona"},
      {customer_id:"contact-b",organization_id:second,display_name:"Contacto exclusivo B",email:"b@example.test",phone:"",city:"Terrassa"},
    ],
    service_requests:[
      {id:"request-a",organization_id:MOCK_ORGANIZATION_ID,customer_id:"customer-a",customer_name:"Cliente A",notes:"Solicitud exclusiva A",status:"new"},
      {id:"request-b",organization_id:second,customer_id:"customer-b",customer_name:"Cliente B",notes:"Solicitud exclusiva B",status:"new"},
    ],
  }});
  let release!:()=>void;
  const blocked=new Promise<void>(resolve=>{release=resolve;});
  let pending=0;
  await page.route(`${MOCK_SUPABASE_URL}/rest/v1/**`,async route=>{
    const url=new URL(route.request().url());
    if(route.request().method()==="GET"&&url.searchParams.get("organization_id")===`eq.${second}`
      &&/\/(organization_services|organization_customers|service_requests)$/.test(url.pathname)){
      pending++;
      await blocked;
    }
    await route.fallback();
  });
  await page.goto("/empresa");
  await modules(page).getByRole("button",{name:"Servicios",exact:true}).click();
  await expect(page.getByText("Servicio exclusivo A",{exact:true})).toBeVisible();
  await expect(page.getByText("Contacto exclusivo A",{exact:true})).toBeVisible();
  await page.getByLabel("Servicio",{exact:true}).fill("Borrador de A");
  const selection=page.getByRole("combobox",{name:"Negocios anteriores",exact:true});
  await selection.selectOption(second);
  await expect.poll(()=>pending).toBe(3);
  await expect(page.getByText("Servicio exclusivo A",{exact:true})).toHaveCount(0);
  await expect(page.getByText("Contacto exclusivo A",{exact:true})).toHaveCount(0);
  await expect(page.getByText("Solicitud exclusiva A",{exact:false})).toHaveCount(0);
  await expect(page.getByText("Cargando datos de la empresa activa...",{exact:true})).toBeVisible();
  await expect(page.getByRole("button",{name:"Guardar servicio",exact:true})).toBeDisabled();
  await expect(page.getByLabel("Servicio",{exact:true})).toHaveValue("");
  await selection.selectOption(MOCK_ORGANIZATION_ID);
  await expect(page.getByText("Servicio exclusivo A",{exact:true})).toBeVisible();
  release();
  await expect(page.getByText("Servicio exclusivo B",{exact:true})).toHaveCount(0);
  await expect(page.getByText("Contacto exclusivo B",{exact:true})).toHaveCount(0);
  await selection.selectOption(second);
  await expect(page.getByText("Servicio exclusivo B",{exact:true})).toBeVisible();
  await expect(page.getByText("Contacto exclusivo B",{exact:true})).toBeVisible();
  await expect(page.getByText("Servicio exclusivo A",{exact:true})).toHaveCount(0);
});

test("la visibilidad del editor, del perfil y de las sedes permanece sincronizada",async({page})=>{
  const {tables}=await installSupabaseMock(page,{tables:{organizations:[organizations[0]]}});
  await page.goto("/empresa");
  await modules(page).getByRole("button",{name:"Perfil público",exact:true}).click();
  const editor=page.locator(".social-business-editor");
  const profile=page.locator(".business-live-profile");
  await expect(editor).toContainText("Empresa A: perfil privado");
  await editor.getByRole("button",{name:"Publicar mi empresa",exact:true}).click();
  await expect(editor).toContainText("Empresa A: perfil público");
  await expect(profile.getByRole("button",{name:"Ocultar negocio",exact:true})).toBeVisible();
  expect(tables.organizations[0].published).toBe(true);
  await profile.getByRole("button",{name:"Ocultar negocio",exact:true}).click();
  await expect(editor).toContainText("Empresa A: perfil privado");
  await expect(editor.getByRole("link",{name:"Ver como Cliente",exact:true})).toHaveCount(0);
  await modules(page).getByRole("button",{name:"Tiendas y sedes",exact:true}).click();
  await expect(page.locator(".live-locations")).toContainText("Negocio privado");
  await page.locator(".live-locations").getByRole("button",{name:"Publicar negocio",exact:true}).click();
  await expect(page.locator(".live-locations")).toContainText("Negocio público");
  await modules(page).getByRole("button",{name:"Perfil público",exact:true}).click();
  await expect(editor).toContainText("Empresa A: perfil público");
  await editor.getByRole("link",{name:"Ver como Cliente",exact:true}).click();
  await expect(page).toHaveURL(new RegExp(`/cliente\\?negocio=${MOCK_ORGANIZATION_ID}$`));
  await expect(page.getByRole("dialog")).toContainText("Empresa A");
});

test("el selector de empresa sigue disponible en móvil fuera de Servicios",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await installSupabaseMock(page,{tables:{organizations}});
  await page.goto("/empresa");
  const selection=page.getByRole("combobox",{name:"Cambiar de empresa activa",exact:true});
  await expect(selection).toBeVisible();
  await expect(selection).toHaveValue(MOCK_ORGANIZATION_ID);
  await page.getByRole("navigation",{name:"Espacios conectados"}).getByRole("button",{name:"Perfil público",exact:true}).click();
  await selection.selectOption(second);
  await expect(page.locator(".business-live-profile").getByRole("heading",{name:"Perfil de Empresa B",exact:true})).toBeVisible();
  await expect(page.locator(".social-business-editor")).toContainText("Empresa B");
  await expect(page.locator(".social-business-editor")).not.toContainText("Empresa A");
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});
