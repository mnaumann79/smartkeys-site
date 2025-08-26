// API endpoint for revoking licenses
// Importance: Provides mutation endpoint for React Query to revoke licenses

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

    // Update license status to revoked
    const { error: updateError } = await supabase
      .from("licenses")
      .update({ status: "revoked" })
      .eq("id", licenseId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Database error revoking license:", updateError);
      return serverErrorResponse("Failed to revoke license");
    }

    return successResponse({ message: "License revoked successfully" });
  } catch (error) {
    console.error("Unexpected error in revoke license API:", error);
    return serverErrorResponse("Internal server error");
  }
}
