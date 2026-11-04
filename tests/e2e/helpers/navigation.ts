import { expect, type Page } from "@playwright/test";

/** Exercise the actual account menu rather than bypassing it with a URL. */
export async function openAccountMenu(page: Page) {
  const menu = page.locator(".app-account-actions:visible");
  if (await menu.count()) {
    if (await menu.getAttribute("open") === null) await menu.locator("summary").click();
    return menu;
  }
  return page.locator("body"); // Workspace activation still exposes the switch directly.
}

export async function switchAccountExperience(page: Page, experience: "business" | "customer") {
  await openAccountMenu(page);
  await page.getByRole("combobox", { name: "Cambiar experiencia de la cuenta", exact: true }).selectOption(experience);
  await expect(page).toHaveURL(experience === "business" ? /\/empresa(?:\?|$)/ : /\/cliente(?:\?|$)/);
}

export async function openAccountSettings(page: Page) {
  const menu = await openAccountMenu(page);
  await menu.getByRole("button", { name: "Mi cuenta y configuración", exact: true }).click();
}

export async function openBusinessSection(page: Page, section: string) {
  const desktop = page.getByRole("navigation", { name: "Módulos disponibles", exact: true });
  const mobile = page.getByRole("navigation", { name: "Navegación Empresa", exact: true });
  // Both menus mount after the authenticated workspace finishes loading.
  await expect.poll(async () => await desktop.isVisible() || await mobile.isVisible()).toBe(true);
  const label = section === "Mensajes" ? "Conversaciones" : section === "Inicio" ? "Panel general" : section;
  if (await desktop.isVisible()) {
    await desktop.getByRole("button", { name: label, exact: true }).click();
    return;
  }
  if (section === "Inicio" || section === "Mensajes") {
    await mobile.getByRole("button", { name: section, exact: true }).click();
  } else if (section === "Perfil público") {
    await mobile.getByRole("button", { name: "Perfil", exact: true }).click();
  } else if (section === "Proyectos y agenda") {
    await mobile.getByRole("button", { name: "Agenda", exact: true }).click();
  } else {
    await mobile.getByRole("button", { name: "Gestión", exact: true }).click();
    await page.locator(".business-management").getByRole("button", { name: new RegExp("^" + section.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) }).click();
  }
}

export async function openBusinessProfileSection(page: Page, section: string) {
  await openBusinessSection(page, "Perfil público");
  await page.getByRole("navigation", { name: "Editar perfil público", exact: true })
    .getByRole("button", { name: section, exact: true }).click();
}
