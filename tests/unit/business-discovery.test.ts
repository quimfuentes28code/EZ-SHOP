import assert from "node:assert/strict";
import { test } from "node:test";
import { getBusinessMapPoints, hasValidCoordinates, matchesBusinessLocation, matchesBusinessQuery } from "../../src/lib/business-discovery";

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

const mapBusinesses = [{ ...business, published: true }, { ...business, id: "private", published: false }];
const branch = { id: "terrassa", organization_id: "one", name: "Centro", city: "Terrassa", published: true, latitude: 41.56, longitude: 2.01 };

test("el mapa conserva un identificador por sede y su empresa para abrir el perfil", () => {
  const points = getBusinessMapPoints(mapBusinesses, [branch, { ...branch, id: "barcelona", city: "Barcelona" }]);
  assert.deepEqual(points.map(point => [point.id, point.organizationId]), [["terrassa", "one"], ["barcelona", "one"]]);
  assert.equal(points[0].name, "Luna Studio · Centro");
});

test("los filtros del mapa aplican localidad por sede y empresas previamente filtradas", () => {
  const branches = [branch, { ...branch, id: "barcelona", city: "Barcelona" }];
  assert.deepEqual(getBusinessMapPoints(mapBusinesses, branches, " TÉRRASSA ").map(point => point.id), ["terrassa"]);
  assert.deepEqual(getBusinessMapPoints([], branches), []);
  assert.deepEqual(getBusinessMapPoints(mapBusinesses, branches, "Girona"), []);
});

test("el mapa excluye sedes privadas, empresas privadas y coordenadas inválidas", () => {
  const branches = [
    branch,
    { ...branch, id: "private-branch", published: false },
    { ...branch, id: "private-company", organization_id: "private" },
    { ...branch, id: "unknown-company", organization_id: "unknown" },
    { ...branch, id: "missing-latitude", latitude: null },
    { ...branch, id: "missing-longitude", longitude: null },
    { ...branch, id: "infinite", latitude: Infinity },
    { ...branch, id: "nan", longitude: NaN },
    { ...branch, id: "north", latitude: 90.1 },
    { ...branch, id: "west", longitude: -180.1 },
  ];
  assert.deepEqual(getBusinessMapPoints(mapBusinesses, branches).map(point => point.id), ["terrassa"]);
});

test("las coordenadas admiten cero y los límites geográficos sin coerción", () => {
  assert.equal(hasValidCoordinates(0, 0), true);
  assert.equal(hasValidCoordinates(-90, -180), true);
  assert.equal(hasValidCoordinates(90, 180), true);
  assert.equal(hasValidCoordinates(undefined, 0), false);
  assert.equal(hasValidCoordinates(0, null), false);
  assert.equal(hasValidCoordinates(0, Infinity), false);
});
