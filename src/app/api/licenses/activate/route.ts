export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// License activation API: validates license and binds it to a device
// Importance: Core functionality for the SmartKeys app - allows users to activate their licenses
// on specific devices with proper error handling and validation.

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { signPayload } from "@/lib/sign";
import { revalidatePath } from "next/cache";
import {
  ValidationError,
  LicenseError,
  DatabaseError,
  createApiErrorResponse,
  withErrorHandling,
  handleDatabaseError,
  handleLicenseError,
  logError,
  LogLevel,
} from "@/lib/error-handling";

// Request body type for license activation
type Body = { license_key?: string; device_id?: string; device_name?: string | null };

// Helper function to extract PostgreSQL error codes
// Importance: Allows specific handling of database constraint violations
function pgCode(err: unknown): string | null {
  if (err && typeof err === "object" && "code" in err) {
    const code = (err as { code?: unknown }).code;
    return typeof code === "string" ? code : null;
  }
  return null;
}

// Main license activation handler with comprehensive error handling
// Importance: Wraps the entire function with error handling and logging
const activateLicense = withErrorHandling(async (req: Request) => {
  const admin = createAdminClient();

  let successPayload: {
    ok: true;
    bound: true;
    device_id: string;
    license_status: "active";
  } | null = null;

  // Parse and validate request body
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch (error) {
    logError(LogLevel.WARN, "Invalid JSON in license activation request", error instanceof Error ? error : undefined);
    throw new ValidationError("Invalid JSON in request body");
  }

  const license_key = (body.license_key ?? "").trim();
  const device_id = (body.device_id ?? "").trim();
  const device_name = body.device_name ?? null;

  // Validate required parameters
  if (!license_key || !device_id) {
    logError(LogLevel.WARN, "Missing required parameters in license activation", undefined, {
      license_key: !!license_key,
      device_id: !!device_id,
    });
    throw new ValidationError("Missing required parameters: license_key and device_id");
  }

  // Find license (case-insensitive)
  const { data: lic, error: e1 } = await admin
    .from("licenses")
    .select("id,status")
    .ilike("license_key", license_key)
    .single();

  if (e1) {
    throw handleDatabaseError(e1, "license lookup");
  }

  if (!lic) {
    logError(LogLevel.WARN, "License not found", undefined, { license_key });
    throw new LicenseError("License not found", "license_not_found");
  }

  if (lic.status !== "active") {
    logError(LogLevel.WARN, "License is not active", undefined, { license_id: lic.id, status: lic.status });
    throw new LicenseError("License is not active", "license_inactive");
  }

  // Try to insert new activation
  const { error: insErr } = await admin.from("activations").insert({
    license_id: lic.id,
    device_id,
    device_name,
  });

  if (!insErr) {
    // New activation successful
    successPayload = { ok: true, bound: true, device_id, license_status: "active" as const };
  } else {
    // Handle unique violation (already bound to a device)
    const code = pgCode(insErr);
    if (code === "23505") {
      // Get existing activation to check device match
      const { data: act, error: selErr } = await admin
        .from("activations")
        .select("id, device_id")
        .eq("license_id", lic.id)
        .single();

      if (selErr) {
        throw handleDatabaseError(selErr, "activation lookup after unique violation");
      }

      if (!act) {
        throw new DatabaseError("Activation record not found after unique violation");
      }

      if (act.device_id !== device_id) {
        // Different device trying to use the license
        logError(LogLevel.WARN, "Device mismatch in license activation", undefined, {
          license_id: lic.id,
          requested_device: device_id,
          bound_device: act.device_id,
        });
        throw new LicenseError("License is already bound to a different device", "device_mismatch");
      }

      // Same device, update last seen timestamp
      const { error: updErr } = await admin
        .from("activations")
        .update({ last_seen_at: new Date().toISOString(), device_name })
        .eq("id", act.id);

      if (updErr) {
        throw handleDatabaseError(updErr, "activation update");
      }

      successPayload = { ok: true, bound: true, device_id, license_status: "active" as const };
    } else {
      // Other database errors
      throw handleDatabaseError(insErr, "activation insert");
    }
  }

  // Return successful activation
  if (successPayload) {
    const { json: j, sig } = signPayload(successPayload);
    logError(LogLevel.INFO, "License activated successfully", undefined, {
      license_id: lic.id,
      device_id,
    });
    revalidatePath("/dashboard/licenses");
    return new NextResponse(j, { headers: { "x-license-sig": sig, "content-type": "application/json" } });
  }

  throw new Error("Unexpected state: no success payload generated");
}, "license activation");

// Export the POST handler with proper error handling
export async function POST(req: Request) {
  try {
    return await activateLicense(req);
  } catch (error) {
    // Handle specific error types with appropriate HTTP status codes
    if (error instanceof ValidationError) {
      return createApiErrorResponse(error, 400);
    } else if (error instanceof LicenseError) {
      const status =
        error.code === "license_not_found"
          ? 404
          : error.code === "license_inactive"
          ? 409
          : error.code === "device_mismatch"
          ? 423
          : 400;
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
