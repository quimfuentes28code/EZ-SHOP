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
