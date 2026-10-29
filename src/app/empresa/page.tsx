import { RealExperience } from "@/components/real-experience";

// The canonical empresa area is now backed by authenticated Supabase data.
// The previous visual prototype remains at /demo/empresa.
export default function BusinessPage() {
  return <RealExperience accountType="business" />;
}
