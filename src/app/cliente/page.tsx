"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CalendarCheck2, Camera, CakeSlice, Heart, Scissors, ShieldCheck } from "lucide-react";
const examples = [
  {name:"Corte de pelo",business:"Barbería Norte",date:"6 nov. · 17:30",status:"Confirmada",icon:Scissors},
  {name:"Sesión fotográfica",business:"Lumen Studio",date:"12 nov. · 10:00",status:"Galería por revisar",icon:Camera},
  {name:"Tarta personalizada",business:"Dulce Taller",date:"14 nov. · 11:00",status:"En preparación",icon:CakeSlice},
];
export default function ClientPage() {
  const [tab,setTab]=useState<"activity"|"favorites"|"account">("activity");
  return <div className="container client-page">
    <div className="eyebrow">EXPERIENCIA CLIENTE · DEMO</div><h1>Todo lo que reservas, en un mismo lugar.</h1><p className="muted">Una única cuenta para consultar servicios de distintos negocios, con acceso limitado a cada relación comercial.</p>
    <div className="client-tabs"><button className={tab==="activity"?"active":""} onClick={()=>setTab("activity")}>Mi actividad</button><button className={tab==="favorites"?"active":""} onClick={()=>setTab("favorites")}>Favoritos</button><button className={tab==="account"?"active":""} onClick={()=>setTab("account")}>Mi perfil</button></div>
    {tab==="activity"?<div className="client-cards">{examples.map(e=>{const Icon=e.icon;return <article className="client-card" key={e.name}><div className="client-icon"><Icon size={24}/></div><div><h3>{e.name}</h3><p>{e.business}</p><small>{e.date}</small></div><span className="status">{e.status}</span></article>})}</div>:tab==="favorites"?<div className="empty-card"><Heart size={28}/><h3>Tus negocios favoritos</h3><p>Aquí se mostrarán los negocios guardados cuando exista una cuenta real.</p></div>:<div className="empty-card"><ShieldCheck size={29}/><h3>Una sola identidad</h3><p>El registro y la gestión de datos personales se implementarán con autenticación y permisos reales en el siguiente hito.</p></div>}
    <Link className="button primary" href="/explorar">Descubrir negocios <ArrowRight size={17}/></Link><div className="notice"><CalendarCheck2 size={20}/><p>Estos servicios son ficticios y no se pueden modificar o pagar. La cuenta cliente real llegará antes del mapa y del marketplace completo.</p></div>
  </div>;
}
