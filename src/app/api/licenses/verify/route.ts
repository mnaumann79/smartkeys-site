export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// License verification API: checks if a license is valid and bound to the specified device
// Importance: Core security function - validates licenses before allowing software to run
// with proper error handling and logging.

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { signPayload } from "@/lib/sign";
import {
  ValidationError,
  LicenseError,
  DatabaseError,
  createApiErrorResponse,
  withErrorHandling,
  handleDatabaseError,
  logError,
  LogLevel,
} from "@/lib/error-handling";

// Main license verification handler with comprehensive error handling
// Importance: Wraps the entire function with error handling and logging
const verifyLicense = withErrorHandling(async (req: Request) => {
  const admin = createAdminClient();
  const url = new URL(req.url);
  const license_key = url.searchParams.get("license_key");
  const device_id = url.searchParams.get("device_id");

  // Validate required parameters
  if (!license_key || !device_id) {
    logError(LogLevel.WARN, "Missing required parameters in license verification", undefined, {
      license_key: !!license_key,
      device_id: !!device_id,
    });
    throw new ValidationError("Missing required parameters: license_key and device_id");
  }

  // Find license
  const { data: lic, error: licError } = await admin
    .from("licenses")
    .select("id, status")
    .eq("license_key", license_key)
    .single();

  if (licError) {
    throw handleDatabaseError(licError, "license lookup");
  }

  if (!lic) {
    logError(LogLevel.WARN, "License not found during verification", undefined, { license_key });
    throw new LicenseError("License not found", "license_not_found");
  }

  if (lic.status !== "active") {
    logError(LogLevel.WARN, "License is not active during verification", undefined, {
      license_id: lic.id,
      status: lic.status,
    });
    throw new LicenseError("License is not active", "license_inactive");
  }

  // Check activation
  const { data: act, error: actError } = await admin
    .from("activations")
    .select("device_id")
    .eq("license_id", lic.id)
    .maybeSingle();

  if (actError) {
    throw handleDatabaseError(actError, "activation lookup");
  }

  const ok = !!act && act.device_id === device_id;
  const payload = { ok, reason: ok ? null : ("not_activated_or_mismatch" as const) };

  // Log verification result
  logError(LogLevel.INFO, "License verification completed", undefined, {
    license_id: lic.id,
    device_id,
    verified: ok,
  });

  const { json, sig } = signPayload(payload);
  return new NextResponse(json, { headers: { "x-license-sig": sig, "content-type": "application/json" } });
}, "license verification");

// Export the POST handler with proper error handling
export async function GET(req: Request) {
  try {
    return await verifyLicense(req);
  } catch (error) {
    // Handle specific error types with appropriate HTTP status codes
    if (error instanceof ValidationError) {
      return createApiErrorResponse(error, 400);
    } else if (error instanceof LicenseError) {
      const status = error.code === "license_not_found" ? 404 : error.code === "license_inactive" ? 409 : 400;
      return createApiErrorResponse(error, status);
    } else if (error instanceof DatabaseError) {
      return createApiErrorResponse(error, 500);
    } else {
      // Handle unexpected errors
      const unexpectedError = error instanceof Error ? error : new Error(String(error));
      return createApiErrorResponse(unexpectedError, 500, process.env.NODE_ENV === "development");
    }
  }
}
