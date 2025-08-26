// API endpoint for deleting licenses (dev only)
// Importance: Provides mutation endpoint for React Query to delete licenses in development

import { createClient } from "@/lib/supabase/server";
import { successResponse, unauthorizedResponse, serverErrorResponse, notFoundResponse } from "@/lib/api-utils";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // Only allow in development mode
  if (process.env.NODE_ENV !== "development") {
    return serverErrorResponse("Delete endpoint only available in development");
  }

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
      .select("id, source")
      .eq("id", licenseId)
      .eq("user_id", user.id)
      .single();

    if (selectError || !license) {
      return notFoundResponse();
    }

    // Only allow deletion of test licenses in development
    if (license.source !== "test") {
      return serverErrorResponse("Can only delete test licenses in development");
    }

    // Delete the license (this will cascade to activations due to foreign key)
    const { error: deleteError } = await supabase.from("licenses").delete().eq("id", licenseId).eq("user_id", user.id);

    if (deleteError) {
      console.error("Database error deleting license:", deleteError);
      return serverErrorResponse("Failed to delete license");
    }

    return successResponse({ message: "License deleted successfully" });
  } catch (error) {
    console.error("Unexpected error in delete license API:", error);
    return serverErrorResponse("Internal server error");
  }
}
