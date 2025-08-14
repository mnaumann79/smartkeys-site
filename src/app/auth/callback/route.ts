import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ProfileMeta = { full_name?: string; avatar_url?: string };
function metaString(meta: unknown, key: keyof ProfileMeta): string | null {
  if (typeof meta === "object" && meta) {
    const v = (meta as Record<string, unknown>)[key as string];
    return typeof v === "string" ? v : null;
  }
  return null;
}

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

  return NextResponse.redirect(new URL(redirect, process.env.NEXT_PUBLIC_APP_URL));
}
