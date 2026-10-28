"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Camera, CakeSlice, MapPinned, Search, Scissors, Wrench } from "lucide-react";
const examples = [
  {id:"photo",name:"Lumen Studio",category:"Fotografía y vídeo",city:"Barcelona",desc:"Retratos, producto y vídeo para empresas",icon:Camera},
  {id:"beauty",name:"Barbería Norte",category:"Peluquería y estética",city:"Barcelona",desc:"Barbería y cuidado personal",icon:Scissors},
  {id:"bakery",name:"Dulce Taller",category:"Panadería y pastelería",city:"Barcelona",desc:"Tartas por encargo y repostería",icon:CakeSlice},
  {id:"repairs",name:"Taller Central",category:"Taller y reparaciones",city:"Barcelona",desc:"Mantenimiento y reparación",icon:Wrench},
];
export default function ExplorePage(){
 const [query,setQuery]=useState(""); const [category,setCategory]=useState("all");const [map,setMap]=useState(false);
 const filtered=examples.filter(e=>(category==="all"||category===e.id)&&(e.name+" "+e.category+" "+e.city+" "+e.desc).toLocaleLowerCase("es").includes(query.toLocaleLowerCase("es")));
 return <div className="container explore-page"><div className="eyebrow">DIRECTORIO · VISTA PREVIA</div><h1>Descubre negocios y servicios.</h1><p className="muted">Esta pantalla muestra cómo evolucionará el directorio. Todos los negocios son ficticios.</p><div className="explore-filters"><div className="search-field"><Search size={18}/><input aria-label="Buscar negocios" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar por negocio, servicio o ciudad"/></div><select aria-label="Filtrar por sector" className="field" value={category} onChange={e=>setCategory(e.target.value)}><option value="all">Todos los sectores</option>{examples.map(e=><option key={e.id} value={e.id}>{e.category}</option>)}</select><button className="button secondary" onClick={()=>setMap(x=>!x)}><MapPinned size={17}/>{map?"Ver lista":"Ver mapa futuro"}</button></div>
 {map?<div className="empty-card map-placeholder"><MapPinned size={34}/><h2>El mapa real llegará después</h2><p>Será necesario almacenar ubicaciones publicadas con consentimiento, geocodificar direcciones, buscar por proximidad y contar con negocios activos.</p><button className="button secondary" onClick={()=>setMap(false)}>Volver a lista</button></div>:<div className="directory-grid">{filtered.map(e=>{const Icon=e.icon;return <article className="directory-card" key={e.id}><div className="directory-image"><Icon size={42}/><span>NEGOCIO FICTICIO</span></div><div className="directory-body"><small>{e.category} · {e.city}</small><h3>{e.name}</h3><p>{e.desc}</p><span className="fake-link">Perfil y reservas en un futuro hito <ArrowRight size={16}/></span></div></article>})}</div>}
 {!map&&filtered.length===0&&<div className="empty-card"><h3>Sin resultados de ejemplo</h3><p>Prueba con otra categoría o palabra clave.</p></div>}
 <div className="notice"><MapPinned size={20}/><p>El mapa y las reservas todavía no están conectados a datos reales. No mostramos ubicaciones ni disponibilidad inventadas.</p></div><Link href="/onboarding" className="inline-link">¿Tienes un negocio? Configura tu panel <ArrowRight size={17}/></Link></div>;
}
