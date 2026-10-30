import type { Page } from "@playwright/test";

// Deterministic map adapter for UI journeys: this exercises the component's
// marker/pick callbacks without relying on a CDN, live tiles or geolocation.
// It does not certify Leaflet's rendering or the map provider's availability.
export async function installLeafletMock(page: Page) {
  await page.addInitScript(() => {
    type MapStub = {
      element: HTMLElement;
      setView: () => MapStub;
      fitBounds: () => void;
      on: (name: string, handler: (event: { latlng: { lat: number; lng: number } }) => void) => MapStub;
      remove: () => void;
    };
    Object.assign(window, {
      autonoLeaflet: {
        map(element: HTMLElement): MapStub {
          const map: MapStub = {
            element,
            setView: () => map,
            fitBounds: () => {},
            on: (_name, handler) => {
              const pick = document.createElement("button");
              pick.type = "button";
              pick.textContent = "Elegir ubicación de prueba";
              pick.addEventListener("click", () => handler({ latlng: { lat: 41.563211, lng: 2.008755 } }));
              element.appendChild(pick);
              return map;
            },
            remove: () => element.replaceChildren(),
          };
          return map;
        },
        marker(point: [number, number]) {
          const button = document.createElement("button");
          button.type = "button";
          button.dataset.testid = "map-marker";
          button.dataset.latitude = String(point[0]);
          button.dataset.longitude = String(point[1]);
          const marker = {
            addTo: (map: MapStub) => { map.element.appendChild(button); return marker; },
            bindPopup: (content: HTMLElement) => {
              button.textContent = "Pin: " + content.textContent;
              return marker;
            },
            on: (_name: string, handler: () => void) => {
              button.addEventListener("click", handler);
              return marker;
            },
          };
          return marker;
        },
        tileLayer: () => ({ addTo: () => {} }),
      },
    });
  });
  await page.route("https://unpkg.com/leaflet@*/**", (route) => route.abort("blockedbyclient"));
  await page.route("https://tile.openstreetmap.org/**", (route) => route.abort("blockedbyclient"));
}
