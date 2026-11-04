import assert from "node:assert/strict";
import { test } from "node:test";
import { BUSINESS_DESKTOP_GROUPS, BUSINESS_NAVIGATION, CLIENT_NAVIGATION, businessPrimarySection, customerPrimarySection, navigationFor } from "../../src/lib/app-navigation";

test("las dos experiencias tienen cinco destinos principales y etiquetas estables", () => {
  assert.deepEqual(CLIENT_NAVIGATION.map(item => item.label), ["Explorar", "Mapa", "Favoritos", "Mensajes", "Perfil"]);
  assert.deepEqual(BUSINESS_NAVIGATION.map(item => item.label), ["Inicio", "Agenda", "Mensajes", "Gestión", "Perfil"]);
  for (const experience of ["customer", "business"] as const) {
    const entries = navigationFor(experience);
    assert.equal(entries.length, 5);
    assert.equal(new Set(entries.map(item => item.id)).size, 5);
  }
});

test("los destinos heredados seleccionan su sección principal sin perder compatibilidad", () => {
  assert.equal(customerPrimarySection("actividad"), "perfil");
  assert.equal(customerPrimarySection("novedades"), "explorar");
  assert.equal(customerPrimarySection("mapa"), "mapa");
  assert.equal(businessPrimarySection("diseno"), "perfil");
  assert.equal(businessPrimarySection("negocio"), "perfil");
  assert.equal(businessPrimarySection("workboard"), "agenda");
  assert.equal(businessPrimarySection("agenda"), "agenda");
  assert.equal(businessPrimarySection("clientes"), "gestion");
  assert.equal(businessPrimarySection("gestion-hub"), "gestion");
});

test("el escritorio agrupa todas las herramientas actuales sin repetir destinos", () => {
  const destinations = BUSINESS_DESKTOP_GROUPS.flatMap(group => group.items.map(item => item.id));
  assert.equal(new Set(destinations).size, destinations.length);
  assert.deepEqual([...destinations].sort(), ["inicio", "workboard", "mensajes", "clientes", "solicitudes-empresa", "gestion", "sedes", "negocio", "herramientas"].sort());
  assert.deepEqual(BUSINESS_DESKTOP_GROUPS.map(group => group.label), ["Inicio", "Agenda", "Mensajes", "Gestión", "Perfil público", "Herramientas"]);
});
