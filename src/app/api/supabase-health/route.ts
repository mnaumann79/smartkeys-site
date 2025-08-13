import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getSession();
  return NextResponse.json({
    ok: !error,
    hasSession: !!data.session,
    error: error?.message ?? null,
  });
}
