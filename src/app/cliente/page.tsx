import { RealExperience } from "@/components/real-experience";

// The canonical cliente area is now backed by authenticated Supabase data.
// The previous visual prototype remains at /demo/cliente.
export default function ClientPage() {
  return <RealExperience accountType="customer" />;
}
