"use client";
import {useEffect,useRef,useState} from "react";
import {MapPinned, MapPin, RefreshCw} from "lucide-react";

type Point={id:string;name:string;latitude:number;longitude:number};
type LeafletMap={
 setView:(p:[number,number],z:number)=>LeafletMap;
 on:(name:string,handler:(e:{latlng:{lat:number;lng:number}})=>void)=>LeafletMap;
 fitBounds:(p:[number,number][],config:{padding:[number,number];maxZoom:number})=>void;
 remove:()=>void;
};
type LeafletMarker={
 addTo:(map:LeafletMap)=>LeafletMarker;
 on:(name:string,handler:()=>void)=>LeafletMarker;
 bindPopup:(content:HTMLElement)=>LeafletMarker;
};
type LeafletLibrary={
 map:(element:HTMLElement)=>LeafletMap;
 marker:(point:[number,number])=>LeafletMarker;
 tileLayer:(url:string,options:{attribution:string;maxZoom:number})=>{addTo:(map:LeafletMap)=>unknown};
};
declare global{interface Window{autonoLeaflet?:LeafletLibrary;autonoLeafletPromise?:Promise<LeafletLibrary>}}

function loadMapLibrary():Promise<LeafletLibrary>{
 if(window.autonoLeaflet)return Promise.resolve(window.autonoLeaflet);
 if(!window.autonoLeafletPromise){
  window.autonoLeafletPromise=new Promise((resolve,reject)=>{
   const css=document.createElement("link");
   css.rel="stylesheet";
   css.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
   css.integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
   css.crossOrigin="anonymous";
   document.head.appendChild(css);
   const script=document.createElement("script");
   script.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
   script.integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
   script.crossOrigin="anonymous";
   script.onload=()=>{const lib=(window as Window & {L?:LeafletLibrary}).L;if(lib){window.autonoLeaflet=lib;resolve(lib);}else reject(new Error("No se ha podido iniciar el mapa."));};
   script.onerror=()=>reject(new Error("No se ha podido cargar el proveedor de mapas."));
   document.head.appendChild(script);
  }).catch(error=>{window.autonoLeafletPromise=undefined;throw error});
 }
 return window.autonoLeafletPromise;
}

export function BusinessMap({
 points,editable=false,initialPoint,onPick,onSelect,height=325
}:{
 points:Point[];
 editable?:boolean;
 initialPoint?:{latitude:number;longitude:number}|null;
 onPick?:(latitude:number,longitude:number)=>void;
 onSelect?:(id:string)=>void;
 height?:number;
}){
 const container=useRef<HTMLDivElement|null>(null);
 const pickRef=useRef(onPick);pickRef.current=onPick;
 const selectRef=useRef(onSelect);selectRef.current=onSelect;
 const [error,setError]=useState("");
 const [ready,setReady]=useState(false);
 const signature=points.map(p=>[p.id,p.latitude,p.longitude].join(":")).join("|");
 const latitude=initialPoint?.latitude,longitude=initialPoint?.longitude;

 useEffect(()=>{
   if(!container.current)return;
   let active=true;
   let map:LeafletMap|null=null;
   setError("");setReady(false);
   loadMapLibrary().then(L=>{
     if(!active||!container.current)return;
     const coords: [number,number]=latitude!==undefined&&longitude!==undefined
       ?[latitude,longitude]:points.length?[points[0].latitude,points[0].longitude]:[41.3874,2.1699];
     map=L.map(container.current).setView(coords,points.length||latitude!==undefined?12:8);
     L.tileLayer(process.env.NEXT_PUBLIC_MAP_TILE_URL||"https://tile.openstreetmap.org/{z}/{x}/{y}.png",{
        attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
        maxZoom:19
     }).addTo(map);
     if(points.length>1)map.fitBounds(points.map(p=>[p.latitude,p.longitude]),{padding:[40,40],maxZoom:14});
     for(const p of points){
       const el=document.createElement("span");
       el.textContent=p.name;
       L.marker([p.latitude,p.longitude]).addTo(map).bindPopup(el).on("click",()=>selectRef.current?.(p.id));
     }
     if(latitude!==undefined&&longitude!==undefined&&editable){
       const el=document.createElement("span");el.textContent="Ubicación seleccionada";
       L.marker([latitude,longitude]).addTo(map).bindPopup(el);
     }
     if(editable)map.on("click",e=>{
       const lat=Math.round(e.latlng.lat*1000000)/1000000;
       const lng=Math.round(e.latlng.lng*1000000)/1000000;
       pickRef.current?.(lat,lng);
     });
     setReady(true);
   }).catch(e=>{if(active)setError(e instanceof Error?e.message:"Mapa no disponible.");});
   return ()=>{active=false;map?.remove();};
 },[signature,editable,latitude,longitude]);

 return <div className="as-location-map">
   <div className="as-location-map-header"><strong><MapPinned size={17}/> {editable?"Señala la ubicación exacta":"Mapa de negocios"}</strong>
     {editable&&<small>Pulsa en el mapa para colocar tu tienda; solo se publicará cuando lo autorices.</small>}</div>
   {error&&<div className="as-social-empty-large"><MapPin size={23}/><h3>Mapa no disponible</h3><p>{error}</p><button type="button" className="button secondary" onClick={()=>window.location.reload()}><RefreshCw size={15}/> Reintentar</button></div>}
   <div ref={container} className="as-location-map-canvas" style={{height}} aria-label="Mapa interactivo de OpenStreetMap"/>
   {ready&&points.length===0&&!editable&&<div className="as-location-map-empty">Aún no hay tiendas que hayan publicado una ubicación exacta. Puedes buscar negocios por localidad en el directorio.</div>}
   <small className="as-location-map-credit">Mapa: © OpenStreetMap contributors. Solo aparecen posiciones que las empresas han publicado.</small>
 </div>;
}
