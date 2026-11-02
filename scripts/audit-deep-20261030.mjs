import { chromium, firefox, webkit, devices } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const root = "https://autonoservice.quim-fuentes28.workers.dev";
const out = "audit-deep-artifacts";
await mkdir(out, { recursive:true });
const errors=[];
const checks=[];
const paths = [
  "/", "/registro/cliente", "/registro/empresa", "/cliente", "/empresa",
  "/real", "/explorar", "/demo/cliente", "/demo/empresa",
  "/negocio/photo", "/negocio/beauty", "/negocio/bakery", "/negocio/repairs",
  "/onboarding", "/registro", "/mi-plan", "/mensajes"
];
const cases=[
  {engine:"chromium",device:"desktop",factory:chromium,settings:{viewport:{width:1440,height:900}},routes:paths},
  {engine:"chromium",device:"phone360",factory:chromium,settings:{viewport:{width:360,height:780},isMobile:true,hasTouch:true},routes:paths},
  {engine:"chromium",device:"tablet",factory:chromium,settings:{viewport:{width:768,height:1024},isMobile:true,hasTouch:true},routes:["/","/cliente","/empresa","/registro/empresa","/demo/cliente","/explorar"]},
  {engine:"firefox",device:"desktop",factory:firefox,settings:{viewport:{width:1366,height:768}},routes:["/","/registro/cliente","/registro/empresa","/cliente","/empresa","/explorar","/demo/empresa","/negocio/photo"]},
  {engine:"webkit",device:"iphone13",factory:webkit,settings:{...devices["iPhone 13"]},routes:["/","/registro/cliente","/registro/empresa","/cliente","/empresa","/explorar","/demo/empresa","/demo/cliente","/negocio/photo","/mi-plan"]},
];
function add(caseName,path,check,ok,details=""){
  checks.push({case:caseName,path,check,ok,details});
  if(!ok)errors.push({case:caseName,path,check,details});
}
for(const setup of cases){
  const name=setup.engine+"-"+setup.device;
  let browser;
  try{browser=await setup.factory.launch({headless:true,args:setup.engine==="chromium"?["--no-sandbox"]:[]});}
  catch(e){add(name,"(browser)","launch",false,String(e).slice(0,250));continue;}
  const context=await browser.newContext({...setup.settings,locale:"es-ES"});
  for(const path of setup.routes){
    const page=await context.newPage();
    const consoleErrors=[];
    const pageErrors=[];
    const failedResponses=[];
    page.on("pageerror",e=>pageErrors.push(e.message.slice(0,240)));
    page.on("console",m=>{if(m.type()==="error")consoleErrors.push(m.text().slice(0,240));});
    page.on("response",r=>{
      if(r.status()>=400 && (r.url().startsWith(root)||r.url().includes("supabase.co")))
        failedResponses.push([r.status(),r.url().slice(0,200)]);
    });
    try {
      const response=await page.goto(root+path,{waitUntil:"domcontentloaded",timeout:35000});
      await page.waitForTimeout(550);
      const status=response?.status()||0;
      const body=(await page.locator("body").innerText().catch(()=>"")).replace(/\s+/g," ").slice(0,1300);
      const location=page.url().replace(root,"");
      const layout=await page.evaluate(()=>({
        doc:document.documentElement.scrollWidth,width:innerWidth,
        fixed:document.querySelectorAll("[style*='position: fixed']").length,
        main:document.querySelectorAll("main").length,
      }));
      add(name,path,"status",status>=200&&status<400,String(status));
      add(name,path,"nonempty",body.length>=40,body.slice(0,120));
      add(name,path,"js-exception",pageErrors.length===0,JSON.stringify(pageErrors));
      add(name,path,"horizontal-scroll",layout.doc<=layout.width+4,JSON.stringify(layout));
      add(name,path,"http-errors",failedResponses.length===0,JSON.stringify(failedResponses.slice(0,5)));
      checks.push({case:name,path,check:"navigation",ok:true,details:JSON.stringify({location,title:await page.title(),body:body.slice(0,360),consoleErrors:consoleErrors.slice(0,4)})});
      if((path==="/empresa"||path==="/cliente") && !location.startsWith("/registro/")){
        add(name,path,"logged-out-guard",false,"Sin sesión, se esperaba formulario o redirección protegida; URL "+location);
      }
      if(path.startsWith("/registro/") && path.split("/").length===3){
        const access=page.getByRole("button",{name:"Acceder",exact:true});
        add(name,path,"access-switch-present",await access.count()===1,"count "+await access.count());
        if(await access.count()){
          await access.click();
          const login=await page.getByRole("textbox").count();
          add(name,path,"access-form-fields",login>=1,"textboxes "+login);
          const signup=page.getByRole("button",{name:"Crear cuenta",exact:true});
          if(await signup.count())await signup.click();
          add(name,path,"signup-switch-back",await page.getByRole("button",{name:"Crear mi cuenta",exact:true}).count()>=1,"toggle back");
        }
      }
      if(path==="/" && setup.device==="desktop"){
        const links=await page.locator("a[href]").evaluateAll(els=>els.map(x=>({href:x.getAttribute("href"),text:x.textContent?.trim().slice(0,40)})).slice(0,50));
        checks.push({case:name,path,check:"links",ok:true,details:JSON.stringify(links)});
      }
      if(["/","/registro/cliente","/registro/empresa","/empresa"].includes(path) && ["chromium-desktop","webkit-iphone13"].includes(name)){
        await page.screenshot({path:out+"/"+name+"-"+path.replaceAll("/","_")+"-shot.png",fullPage:true,timeout:25000}).catch(()=>{});
      }
    }catch(e){add(name,path,"navigation",false,String(e).slice(0,500));}
    await page.close();
  }
  await context.close();
  await browser.close();
}
// Read-only compiled asset presence. Source presence is not proof that UI is accessible to signed-in users.
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const context=await browser.newContext();
const page=await context.newPage();
try{
  const response=await page.goto(root+"/empresa",{waitUntil:"domcontentloaded",timeout:35000});
  const jsURLs=await page.locator('script[src$=".js"]').evaluateAll(xs=>xs.map(x=>x.src));
  const allJS=[];
  for(const url of jsURLs){
    try{let r=await context.request.get(url,{timeout:16000});if(r.ok())allJS.push(await r.text());}catch{}
  }
  const code=allJS.join("\n");
  for(const marker of ["location-delete-confirmation","Eliminar definitivamente","business-live-mobile-company-switcher","as-company-hero"]){
    checks.push({case:"deployed-artifacts",path:"/empresa",check:marker,ok:code.includes(marker),details:"scripts="+allJS.length+" pageHTTP="+response?.status()});
  }
  checks.push({case:"deployed-artifacts",path:"/empresa",check:"js-scripts",ok:jsURLs.length>0,details:JSON.stringify(jsURLs.slice(0,8))});
}catch(e){errors.push({case:"deployed-artifacts",error:String(e)});}
await context.close();await browser.close();
const summary={date:new Date().toISOString(),root,checks:checks.length,failed:errors.length,errors,byCase:Object.fromEntries([...new Set(checks.map(c=>c.case))].map(k=>[k,{total:checks.filter(c=>c.case===k).length,failed:checks.filter(c=>c.case===k&&!c.ok).length}]))};
await writeFile(out+"/deep-audit.json",JSON.stringify({summary,checks},null,2));
console.log("DEEP_AUDIT_SUMMARY="+JSON.stringify(summary));
console.log("DEEP_AUDIT_FAILURES="+JSON.stringify(errors.slice(0,45)));
console.log("DEEP_AUDIT_PROBES="+JSON.stringify(checks.filter(c=>c.case==="deployed-artifacts")));
if(errors.some(e=>["navigation","js-exception","status","nonempty","logged-out-guard"].includes(e.check))) process.exitCode=1;
