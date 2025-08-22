import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {

  const supabase = createAdminClient();

  const adminUsers = await supabase.auth.admin.listUsers(); // requires service-role
  const { error: rlsErr } = await supabase.from("profiles").select("id").limit(1); // bypasses RLS

  return NextResponse.json({
    hasServiceRole: !("error" in adminUsers) || !adminUsers.error,
    rlsBypassOk: !rlsErr,
    adminError: ("error" in adminUsers) ? adminUsers.error?.message ?? null : null,
    rlsErr: rlsErr?.message ?? null,
  });
}
