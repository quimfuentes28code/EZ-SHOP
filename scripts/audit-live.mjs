import { chromium, devices } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const root = "https://autonoservice.quim-fuentes28.workers.dev";
const outDir = "audit-screenshots";
await mkdir(outDir, { recursive: true });
const paths = [
  "/", "/registro/cliente", "/registro/empresa",
  "/cliente", "/empresa", "/real",
  "/explorar", "/demo/cliente", "/demo/empresa"
];
let failures = 0;
const captures = [];
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
for (const variant of ["desktop", "mobile"]) {
  const context = await browser.newContext({
    ...(variant === "mobile" ? devices["iPhone 13"] : {viewport:{width:1440,height:1000}}),
    ignoreHTTPSErrors: false,
    locale: "es-ES",
  });
  for (const path of paths) {
    const page = await context.newPage();
    const problems = [];
    page.on("pageerror", e=>problems.push("JavaScript: "+e.message));
    page.on("console", m=>{if(m.type()==="error")problems.push("Console: "+m.text().slice(0,250));});
    page.on("response", res=>{
      const url=res.url();
      if(res.status()>=400 && (url.startsWith(root)||url.includes("twxioyfavelyzimrhyun.supabase.co")))
        problems.push("HTTP "+res.status()+" "+url.slice(0,175));
    });
    let status="unavailable";
    let title="";
    let finalUrl="";
    let mainText="";
    try {
      const response = await page.goto(root+path, {waitUntil:"domcontentloaded",timeout:30000});
      status=String(response?.status()??"no response");
      await page.waitForTimeout(1500);
      title=await page.title();
      finalUrl=page.url();
      mainText=(await page.locator("body").innerText().catch(()=>"")).slice(0,600).replace(/\s+/g," ");
      const screenshot = outDir+"/"+variant+"-"+(path==="/"
        ?"home":path.slice(1).replaceAll("/","-"))+".png";
      await page.screenshot({path:screenshot,fullPage:true,timeout:20000}).catch(e=>problems.push("Screenshot: "+e.message));
      if(status.startsWith("4")||status.startsWith("5"))failures++;
      if(mainText.length<30){failures++;problems.push("Empty or nearly-empty page");}
      if(problems.some(p=>p.startsWith("JavaScript:"))){failures++;}
      if(path==="/registro/cliente"||path==="/registro/empresa"){
        const inputCount=await page.locator("input").count();
        if(inputCount<2){failures++;problems.push("Registration UI inputs absent; count="+inputCount);}
        const buttons=await page.getByRole("button").allTextContents().catch(()=>[]);
        captures.push({variant,path,buttons:buttons.map(x=>x.trim()).filter(Boolean).slice(0,10)});
      }
      if(path==="/" && variant==="desktop"){
        const links=await page.locator("a[href]").evaluateAll(els=>els.map(el=>({
          text:el.textContent?.trim().slice(0,45),href:el.getAttribute("href")
        })).filter(x=>x.href?.includes("registro")));
        captures.push({variant,path,registrationLinks:links.slice(0,12)});
      }
    } catch(e){failures++;problems.push("Navigation: "+e.message.slice(0,400));}
    console.log(JSON.stringify({variant,path,status,title,finalUrl,mainText,problems:problems.slice(0,14)}));
    await page.close();
  }
  await context.close();
}
console.log("ADDITIONAL_UI_CHECKS="+JSON.stringify(captures));
await browser.close();
console.log("AUDIT_FAILURES="+failures);
if(failures)process.exitCode=1;
