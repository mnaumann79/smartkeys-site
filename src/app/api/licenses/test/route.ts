// API endpoint for creating test licenses
// Importance: Provides mutation endpoint for React Query to create test licenses

import { createClient } from "@/lib/supabase/server";
import { successResponse, unauthorizedResponse, serverErrorResponse } from "@/lib/api-utils";
import { generateLicenseKey } from "@/lib/licenses/key";

export async function POST() {
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

    // Generate a new license key
    const licenseKey = generateLicenseKey();

    // Insert the test license
    const { data: license, error: insertError } = await supabase
      .from("licenses")
      .insert({
        user_id: user.id,
        license_key: licenseKey,
        status: "active",
        source: "test",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Database error creating test license:", insertError);
      return serverErrorResponse("Failed to create test license");
    }

    return successResponse(license);
  } catch (error) {
    console.error("Unexpected error in test license API:", error);
    return serverErrorResponse("Internal server error");
  }
}
