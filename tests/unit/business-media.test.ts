import assert from "node:assert/strict";
import { test } from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  BUSINESS_MEDIA_BUCKET,
  BUSINESS_MEDIA_URL_TTL_SECONDS,
  businessMediaPath,
  businessMediaReference,
  resolveBusinessMediaUrls,
} from "../../src/lib/business-media";

const path = "11111111-1111-4111-8111-111111111111/photo.jpg";
const secondPath = "22222222-2222-4222-8222-222222222222/draft.jpg";
const legacyUrl = `https://example.supabase.co/storage/v1/object/public/${BUSINESS_MEDIA_BUCKET}/${path}`;

test("conserva referencias duraderas y lee URLs públicas anteriores", () => {
  assert.equal(businessMediaPath(businessMediaReference(path)), path);
  assert.equal(businessMediaPath(legacyUrl), path);
  assert.equal(businessMediaPath(legacyUrl.replace("/public/", "/sign/")+"?token=old"), path);
  assert.equal(businessMediaPath("storage://otro-bucket/"+path), null);
});

test("no acepta rutas que salgan de la carpeta de una organización", () => {
  for (const invalid of ["../private.jpg", "not-a-uuid/photo.jpg", path+"/../private.jpg", path+"/..", path+"//hidden.jpg", path+"?token=x", path+"\n"]) {
    assert.throws(() => businessMediaReference(invalid));
    assert.equal(businessMediaPath(`storage://${BUSINESS_MEDIA_BUCKET}/${invalid}`), null);
  }
  assert.equal(businessMediaPath(`https://example.supabase.co/storage/v1/object/public/otro-bucket/${path}`), null);
});

test("firma una vez cada ruta y oculta referencias denegadas por RLS", async () => {
  const requests: {bucket:string; paths:string[]; ttl:number}[]=[];
  const db={storage:{from:(bucket:string)=>({createSignedUrls:async(paths:string[],ttl:number)=>{
    requests.push({bucket,paths,ttl});
    return {error:null,data:[
      {path,signedUrl:"https://example.supabase.co/signed-authorized",error:null},
      {path:secondPath,signedUrl:null,error:"Access denied"},
    ]};
  }})}} as unknown as Pick<SupabaseClient,"storage">;
  const reference=businessMediaReference(path),denied=businessMediaReference(secondPath);
  const urls=await resolveBusinessMediaUrls(db,[reference,reference,legacyUrl,denied,"javascript:alert(1)","https://images.example.com/cover.jpg"]);
  assert.deepEqual(requests,[{bucket:BUSINESS_MEDIA_BUCKET,paths:[path,secondPath],ttl:BUSINESS_MEDIA_URL_TTL_SECONDS}]);
  assert.equal(urls[reference],urls[legacyUrl]);
  assert.equal(urls[denied],"");
  assert.equal(urls["javascript:alert(1)"],"");
  assert.equal(urls["https://images.example.com/cover.jpg"],"https://images.example.com/cover.jpg");
});

test("un error de Storage nunca recupera la URL pública anterior", async () => {
  const db={storage:{from:()=>({createSignedUrls:async()=>({data:null,error:{message:"Denied"}})})}} as unknown as Pick<SupabaseClient,"storage">;
  const urls=await resolveBusinessMediaUrls(db,[legacyUrl]);
  assert.equal(urls[legacyUrl],"");
});

test("una desconexión no rechaza la carga de pantalla ni recupera URLs públicas", async () => {
  const db={storage:{from:()=>({createSignedUrls:async()=>{throw new Error("Offline");}})}} as unknown as Pick<SupabaseClient,"storage">;
  assert.equal((await resolveBusinessMediaUrls(db,[legacyUrl]))[legacyUrl],"");
});
