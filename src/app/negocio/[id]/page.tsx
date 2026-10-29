import { BusinessPublicProfile } from "@/features/business-profile/components";
import { BUSINESS_IDS } from "@/features/business-profile/model";

// All demo business URLs must be known at build time for static hosting.
export function generateStaticParams() {
  return BUSINESS_IDS.map((id) => ({ id }));
}

export const dynamicParams = false;

export default async function BusinessProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BusinessPublicProfile id={id} />;
}
