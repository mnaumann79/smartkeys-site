// API endpoint for fetching user licenses
// Importance: Provides data for React Query hooks with proper authentication and error handling

import { createClient } from "@/lib/supabase/server";
import { successResponse, unauthorizedResponse, serverErrorResponse } from "@/lib/api-utils";
import type { LicenseWithActivationData } from "@/app/dashboard/licenses/page";

export async function GET() {
  try {
    const supabase = createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorizedResponse();
    }

    // Fetch licenses for the authenticated user
    const { data: raw, error: dbError } = await supabase
      .from("licenses")
      .select(
        `
          id,
          license_key,
          status,
          source,
          created_at,
          activation:activations!activations_license_id_fkey(
            device_id, 
            device_name, 
            activated_at
          )
        `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (dbError) {
      console.error("Database error fetching licenses:", dbError);
      return serverErrorResponse("Failed to fetch licenses");
    }

    // Transform data to match the expected type
    const licenses: LicenseWithActivationData[] = (raw ?? []).map(r => ({
      id: r.id,
      user_id: user.id,
      license_key: r.license_key,
      status: r.status,
      source: r.source,
      external_id: null,
      created_at: r.created_at,
      updated_at: r.created_at,
      activation: Array.isArray(r.activation) ? r.activation[0] ?? null : r.activation ?? null,
    }));

    return successResponse(licenses);
  } catch (error) {
    console.error("Unexpected error in licenses API:", error);
    return serverErrorResponse("Internal server error");
  }
}
