// API endpoint for unbinding devices from licenses
// Importance: Provides mutation endpoint for React Query to unbind devices

import { createClient } from "@/lib/supabase/server";
import { successResponse, unauthorizedResponse, serverErrorResponse, notFoundResponse } from "@/lib/api-utils";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { id: licenseId } = await params;

    // Check if license exists and belongs to user
    const { data: license, error: selectError } = await supabase
      .from("licenses")
      .select("id, status")
      .eq("id", licenseId)
      .eq("user_id", user.id)
      .single();

    if (selectError || !license) {
      return notFoundResponse();
    }

    if (license.status !== "active") {
      return serverErrorResponse("License is not active");
    }

    // Delete the activation record to unbind the device
    const { error: deleteError } = await supabase.from("activations").delete().eq("license_id", licenseId);

    if (deleteError) {
      console.error("Database error unbinding device:", deleteError);
      return serverErrorResponse("Failed to unbind device");
    }

    return successResponse({ message: "Device unbound successfully" });
  } catch (error) {
    console.error("Unexpected error in unbind device API:", error);
    return serverErrorResponse("Internal server error");
  }
}
