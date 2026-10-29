import { BusinessPublicProfile } from "@/features/business-profile/components";

export default async function BusinessProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BusinessPublicProfile id={id} />;
}
