type DiscoverableBusiness = {
  id: string;
  name: string;
  category: string;
  city: string;
  description: string;
};

type DiscoveryLocation = {
  organization_id: string;
  name: string;
  city: string;
  published: boolean;
};

export type BusinessMapPoint = {
  id: string;
  organizationId: string;
  name: string;
  latitude: number;
  longitude: number;
};

export function hasValidCoordinates(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): boolean {
  return typeof latitude === "number" && Number.isFinite(latitude) && Math.abs(latitude) <= 90
    && typeof longitude === "number" && Number.isFinite(longitude) && Math.abs(longitude) <= 180;
}

// Pass the businesses already matched by category/query. The city must also
// match each individual branch, rather than displaying every branch of a match.
export function getBusinessMapPoints(
  businesses: readonly { id: string; name: string; published: boolean }[],
  locations: readonly (DiscoveryLocation & { id: string; latitude: number | null; longitude: number | null })[],
  city = "",
): BusinessMapPoint[] {
  const publicBusinesses = new Map(businesses.filter(business => business.published).map(business => [business.id, business]));
  const term = normalizeDiscoveryText(city);
  return locations.flatMap(location => {
    const business = publicBusinesses.get(location.organization_id);
    if (!business || !location.published || !hasValidCoordinates(location.latitude, location.longitude)
      || (term && !normalizeDiscoveryText(location.city).includes(term))) return [];
    return [{
      id: location.id,
      organizationId: business.id,
      name: `${business.name} · ${location.name}`,
      latitude: location.latitude as number,
      longitude: location.longitude as number,
    }];
  });
}

export function normalizeDiscoveryText(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").trim();
}

export function matchesBusinessLocation(
  business: DiscoverableBusiness,
  locations: readonly DiscoveryLocation[],
  city: string,
): boolean {
  const term = normalizeDiscoveryText(city);
  return !term || normalizeDiscoveryText(business.city).includes(term) || locations.some(
    location => location.published && location.organization_id === business.id && normalizeDiscoveryText(location.city).includes(term),
  );
}

export function matchesBusinessQuery(
  business: DiscoverableBusiness,
  locations: readonly DiscoveryLocation[],
  serviceNames: readonly string[],
  query: string,
): boolean {
  const term = normalizeDiscoveryText(query);
  const branches = locations.filter(location => location.published && location.organization_id === business.id);
  return !term || normalizeDiscoveryText([
    business.name, business.category, business.city, business.description,
    ...branches.flatMap(location => [location.name, location.city]), ...serviceNames,
  ].join(" ")).includes(term);
}
