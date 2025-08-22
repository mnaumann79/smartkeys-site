import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { APP_URL } from "@/lib/config";
import { metaString } from "@/lib/utils";


export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const redirect = url.searchParams.get("redirect") ?? "/dashboard";

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").upsert(
        {
          id: user.id,
          display_name: metaString(user.user_metadata, "full_name"),
          avatar_url: metaString(user.user_metadata, "avatar_url"),
        },
        { onConflict: "id" }
      );
    }
  }

  return NextResponse.redirect(new URL(redirect, APP_URL));
}
