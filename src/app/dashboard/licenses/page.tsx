import { createClient } from "@/lib/supabase/server";
import LicensesClientPage from "./client-page";

// Type for the actual database response structure
export type LicenseWithActivationData = {
  id: string;
  user_id: string;
  license_key: string;
  status: string;
  source: string;
  external_id: string | null;
  created_at: string;
  updated_at: string;
  activation: {
    device_id: string;
    device_name: string;
    activated_at: string;
  } | null;
};

export default async function LicensesPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <p className="text-sm text-muted-foreground">
          You&apos;re not signed in.{" "}
          <a
            className="underline"
            href="/signin?redirect=/dashboard/licenses"
          >
            Sign in
          </a>
        </p>
      </main>
    );
  }

  // Render the client-side component for React Query optimization
  return <LicensesClientPage />;
}
