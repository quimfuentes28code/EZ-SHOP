"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, MapPin, SlidersHorizontal } from "lucide-react";
import { MODULES, SECTORS, sectorById, type ModuleId } from "@/lib/catalog";
import { DEFAULT_CONFIG, loadDemoConfig, saveDemoConfig, type BusinessMode, type DemoConfig } from "@/lib/demo";

const steps = ["Actividad", "Herramientas", "Identidad", "Revisar"];
const modes: {value: BusinessMode; label: string; desc: string}[] = [
  {value:"local",label:"Local físico",desc:"Recibes clientes en un establecimiento"},
  {value:"mobile",label:"A domicilio",desc:"Te desplazas hasta tus clientes"},
  {value:"online",label:"Online",desc:"Trabajas sin una ubicación de atención pública"},
  {value:"hybrid",label:"Mixto",desc:"Combinas varias modalidades"},
];
export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<DemoConfig>(DEFAULT_CONFIG);
  const [sectorQuery,setSectorQuery] = useState("");
  useEffect(() => { setForm(loadDemoConfig()); }, []);
  const set = (partial: Partial<DemoConfig>) => setForm(f=>({...f,...partial}));
  const toggleModule = (id: ModuleId) => {
    if (id === "customers") return;
    setForm(f => ({...f,modules: f.modules.includes(id) ? f.modules.filter(m=>m!==id) : [...f.modules,id]}));
  };
  const sectors = SECTORS.filter(s=>(s.label+" "+s.family+" "+s.examples.join(" ")).toLocaleLowerCase("es").includes(sectorQuery.toLocaleLowerCase("es")));
  const next = () => {
    if (step < 3) setStep(s=>s+1);
    else { saveDemoConfig(form); router.push("/empresa"); }
  };
  return <div className="container onboarding-layout">
    <div className="eyebrow"><SlidersHorizontal size={16}/> CONFIGURACIÓN PERSONALIZADA</div>
    <h1>Diseñemos tu espacio de trabajo.</h1>
    <p className="muted">No necesitas configurar todo ahora. Podrás cambiar tus módulos más adelante.</p>
    <div className="stepper" aria-label={`Paso ${step+1} de 4`}>{steps.map((s,i)=><div key={s} className={`step-indicator ${i<=step?"current":""}`}><div className="step-line"/><span>{i+1}. {s}</span></div>)}</div>
    <div className="form-surface">
      {step===0&&<>
        <div className="step-copy"><h2>¿A qué se dedica tu negocio?</h2><p>Esto nos ayuda a recomendar herramientas. No limita lo que podrás activar.</p></div>
        <label className="input-label" htmlFor="sector-search">Buscar un sector</label><input id="sector-search" className="field" placeholder="Peluquería, panadería, fotografía..." value={sectorQuery} onChange={e=>setSectorQuery(e.target.value)}/>
        <div className="sector-grid">{sectors.map(s=><button key={s.id} className={`option-card ${form.sectorId===s.id?"selected":""}`} onClick={()=>set({sectorId:s.id,modules:s.suggested})} type="button"><span>{s.label}</span><small>{s.family}</small>{form.sectorId===s.id&&<CheckCircle2 size={19}/>}</button>)}</div>
        {sectors.length===0&&<p className="muted">No encontramos ese sector. Prueba "Otro negocio o actividad mixta".</p>}
        <div className="section-spacer"><h3>¿Dónde trabajas?</h3><div className="mode-grid">{modes.map(m=><button key={m.value} type="button" className={`option-card ${form.mode===m.value?"selected":""}`} onClick={()=>set({mode:m.value})}><span>{m.label}</span><small>{m.desc}</small></button>)}</div></div>
      </>}
      {step===1&&<><div className="step-copy"><h2>Elige tus herramientas</h2><p>Recomendación para <strong>{sectorById(form.sectorId).label}</strong>. Puedes combinar funcionalidades de diferentes sectores.</p></div>
        <div className="module-grid">{Object.entries(MODULES).map(([id,meta])=><button type="button" key={id} className={`module-item ${form.modules.includes(id as ModuleId)?"active":""}`} onClick={()=>toggleModule(id as ModuleId)} disabled={id==="customers"} aria-pressed={form.modules.includes(id as ModuleId)}><span className="module-check">{form.modules.includes(id as ModuleId)?<Check size={16}/>:null}</span><span><strong>{meta.label}</strong><small>{meta.desc}</small></span></button>)}</div>
        <p className="hint">Clientes es un módulo base obligatorio. Activar módulos aquí solo cambia la interfaz de esta demo; en producción los permisos se verificarán en el servidor.</p>
      </>}
      {step===2&&<><div className="step-copy"><h2>Cuéntanos sobre tu empresa</h2><p>Preparamos el nombre del panel y los datos de ejemplo.</p></div>
        <div className="form-grid"><div><label className="input-label" htmlFor="business-name">Nombre comercial</label><input id="business-name" className="field" maxLength={80} placeholder="Mi negocio" value={form.name} onChange={e=>set({name:e.target.value})}/></div><div><label className="input-label" htmlFor="business-city">Ciudad / zona</label><input id="business-city" className="field" maxLength={80} placeholder="Barcelona" value={form.city} onChange={e=>set({city:e.target.value})}/></div></div>
        <label className="checkbox-line"><input type="checkbox" checked={form.publicListing} onChange={e=>set({publicListing:e.target.checked})}/><span><strong>Quiero mostrar mi negocio en un futuro directorio público</strong><small>Solo guardamos tu preferencia en esta demo. No se publica ningún perfil real.</small></span></label>
        <div className="notice"><MapPin size={20}/><p>El modo {modes.find(m=>m.value===form.mode)?.label.toLocaleLowerCase("es")} determinará qué dirección o zona se podrá mostrar públicamente en el futuro. Nunca se mostrará una dirección privada sin consentimiento.</p></div>
      </>}
      {step===3&&<><div className="step-copy"><h2>Todo preparado</h2><p>Comprueba los datos. Al finalizar entrarás en una versión de demostración de tu panel.</p></div>
        <div className="review-grid"><div><small>EMPRESA</small><h3>{form.name||"Mi negocio"}</h3><p>{form.city||"Sin ciudad"} · {sectorById(form.sectorId).label}</p></div><div><small>MODALIDAD</small><h3>{modes.find(m=>m.value===form.mode)?.label}</h3><p>{form.publicListing?"Visibilidad futura solicitada":"Perfil público desactivado"}</p></div></div>
        <h3 className="section-heading">{form.modules.length} herramientas activadas</h3><div className="tag-wrap">{form.modules.map(id=><span key={id} className="tag">{MODULES[id].label}</span>)}</div>
        {sectorById(form.sectorId).caution&&<div className="notice"><p>{sectorById(form.sectorId).caution}</p></div>}
        <p className="hint">No se crea ninguna empresa real, usuario ni reserva; se guarda tu configuración de muestra en este navegador.</p>
      </>}
      <div className="form-actions"><button type="button" className="button secondary" disabled={step===0} onClick={()=>setStep(s=>Math.max(0,s-1))}><ArrowLeft size={17}/> Atrás</button><button type="button" className="button primary" onClick={next} disabled={step===2&&!form.name.trim()}>{step===3?"Abrir mi panel":"Continuar"}<ArrowRight size={17}/></button></div>
    </div>
  </div>;
}
