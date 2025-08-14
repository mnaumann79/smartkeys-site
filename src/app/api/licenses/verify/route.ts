export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase/admin";
import { signPayload } from "@/lib/sign";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const license_key = url.searchParams.get("license_key");
  const device_id = url.searchParams.get("device_id");
  if (!license_key || !device_id)
    return NextResponse.json({ ok: false, error: "missing_params" }, { status: 400 });

  const { data: lic } = await admin
    .from("licenses")
    .select("id, status")
    .eq("license_key", license_key)
    .single();

  if (!lic || lic.status !== "active")
    return NextResponse.json({ ok: false, error: "license_inactive" }, { status: 404 });

  const { data: act } = await admin
    .from("activations")
    .select("device_id")
    .eq("license_id", lic.id)
    .maybeSingle();

  const ok = !!act && act.device_id === device_id;
  const payload = { ok, reason: ok ? null : "not_activated_or_mismatch" as const };
  const { json, sig } = signPayload(payload);
  return new NextResponse(json, { headers: { "x-license-sig": sig, "content-type": "application/json" } });
}
