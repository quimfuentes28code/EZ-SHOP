import assert from "node:assert/strict";
import { test } from "node:test";
import { matchesBusinessLocation, matchesBusinessQuery } from "../../src/lib/business-discovery";

const business = {id:"one",name:"Luna Studio",category:"Fotografía",city:"Barcelona",description:"Retratos profesionales"};
const locations = [
  {organization_id:"one",name:"Estudio Centro",city:"Terrassa",published:true},
  {organization_id:"one",name:"Estudio privado",city:"Sabadell",published:false},
  {organization_id:"two",name:"Otra empresa",city:"Girona",published:true},
];

test("la búsqueda por localidad incluye sedes publicadas y la ciudad principal", () => {
  assert.equal(matchesBusinessLocation(business,locations," terraSSA "),true);
  assert.equal(matchesBusinessLocation(business,locations,"barcelona"),true);
  assert.equal(matchesBusinessLocation(business,locations,""),true);
});

test("no atribuye sedes privadas o de otra empresa al negocio", () => {
  assert.equal(matchesBusinessLocation(business,locations,"sabadell"),false);
  assert.equal(matchesBusinessLocation(business,locations,"girona"),false);
  assert.equal(matchesBusinessQuery(business,locations,[],"estudio privado"),false);
});

test("la búsqueda normaliza tildes e incluye servicios y sedes públicas", () => {
  assert.equal(matchesBusinessQuery(business,locations,["Sesión de producto"],"fotografia"),true);
  assert.equal(matchesBusinessQuery(business,locations,["Sesión de producto"],"sesion"),true);
  assert.equal(matchesBusinessQuery(business,locations,[],"Terrassa"),true);
  assert.equal(matchesBusinessQuery(business,locations,[],"Estudio Centro"),true);
});
