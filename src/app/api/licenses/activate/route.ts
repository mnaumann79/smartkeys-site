export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase/admin";
import { signPayload } from "@/lib/sign";

type Body = { license_key: string; device_id: string; device_name?: string };

export async function POST(req: Request) {
  const { license_key, device_id, device_name } = (await req.json()) as Body;

  if (!license_key || !device_id) return NextResponse.json({ error: "missing_params" }, { status: 400 });

  // Find license
  const { data: lic, error: e1 } = await admin
    .from("licenses")
    .select("id, user_id, status")
    .eq("license_key", license_key)
    .single();

  if (e1 || !lic) return NextResponse.json({ error: "license_not_found" }, { status: 404 });
  if (lic.status !== "active") return NextResponse.json({ error: "license_inactive" }, { status: 409 });

  // Existing activation?
  const { data: act } = await admin.from("activations").select("id, device_id").eq("license_id", lic.id).maybeSingle();

  if (!act) {
    // Create activation
    const { error: eIns } = await admin.from("activations").insert({
      license_id: lic.id,
      device_id,
      device_name: device_name ?? null,
    });
    if (eIns) return NextResponse.json({ error: "activation_insert_failed" }, { status: 500 });

    const payload = { ok: true, bound: true, device_id, license_status: "active" as const };
    const { json, sig } = signPayload(payload);
    return new NextResponse(json, { headers: { "x-license-sig": sig, "content-type": "application/json" } });
  }

  // If already bound to same device -> update last_seen; else reject
  if (act.device_id !== device_id)
    return NextResponse.json({ error: "device_mismatch", bound_device_id: act.device_id }, { status: 423 });

  await admin.from("activations").update({ last_seen_at: new Date().toISOString() }).eq("id", act.id);

  const payload = { ok: true, bound: true, device_id, license_status: "active" as const };
  const { json, sig } = signPayload(payload);
  return new NextResponse(json, { headers: { "x-license-sig": sig, "content-type": "application/json" } });
}
