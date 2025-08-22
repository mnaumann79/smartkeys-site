export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { signPayload } from "@/lib/sign";
import { revalidatePath } from "next/cache";

type Body = { license_key?: string; device_id?: string; device_name?: string | null };

function json(status: number, obj: unknown) {
  return NextResponse.json(obj, { status, headers: { "content-type": "application/json" } });
}

function pgCode(err: unknown): string | null {
  if (err && typeof err === "object" && "code" in err) {
    const code = (err as { code?: unknown }).code;
    return typeof code === "string" ? code : null;
  }
  return null;
}

export async function POST(req: Request) {
  const admin = createAdminClient();

  let successPayload: {
    ok: true;
    bound: true;
    device_id: string;
    license_status: "active";
  } | null = null;

  try {
    let body: Body;
    try {
      body = (await req.json()) as Body;
    } catch {
      return json(400, { ok: false, error: "bad_json" });
    }
    const license_key = (body.license_key ?? "").trim();
    const device_id = (body.device_id ?? "").trim();
    const device_name = body.device_name ?? null;
    if (!license_key || !device_id) return json(400, { ok: false, error: "missing_params" });

    // find license (case-insensitive)
    const { data: lic, error: e1 } = await admin
      .from("licenses")
      .select("id,status")
      .ilike("license_key", license_key)
      .single();

    if (e1 || !lic) return json(404, { ok: false, error: "license_not_found" });
    if (lic.status !== "active") return json(409, { ok: false, error: "license_inactive" });

    // try insert
    const { error: insErr } = await admin.from("activations").insert({
      license_id: lic.id,
      device_id,
      device_name,
    });

    if (!insErr) {
      successPayload = { ok: true, bound: true, device_id, license_status: "active" as const };
    } else {
      // unique violation = already bound. Decide if same device or mismatch.
      const code = pgCode(insErr);
      if (code === "23505") {
        const { data: act, error: selErr } = await admin
          .from("activations")
          .select("id, device_id")
          .eq("license_id", lic.id)
          .single();

        if (selErr || !act) {
          return json(500, { ok: false, error: "activation_lookup_failed", details: selErr?.message ?? null });
        }

        if (act.device_id !== device_id) {
          return json(423, { ok: false, error: "device_mismatch", bound_device_id: act.device_id });
        }

        const { error: updErr } = await admin
          .from("activations")
          .update({ last_seen_at: new Date().toISOString(), device_name })
          .eq("id", act.id);

        if (updErr) return json(500, { ok: false, error: "activation_update_failed", details: updErr.message });

        successPayload = { ok: true, bound: true, device_id, license_status: "active" as const };
      } else {
        // FK or other errors
        return json(500, { ok: false, error: "activation_insert_failed", details: insErr.message ?? null });
      }
    }

    // Only one success return here
    if (successPayload) {
      const { json: j, sig } = signPayload(successPayload);
      console.log("License activated:", j);
      revalidatePath("/dashboard/licenses");
      return new NextResponse(j, { headers: { "x-license-sig": sig, "content-type": "application/json" } });
    }
    // fallback, should not reach here
    return json(500, { ok: false, error: "unexpected_no_success" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return json(500, { ok: false, error: "exception", details: msg });
  }
}
