// Server component
import NavClient from "@/components/navbar/nav-client";
import { createClient } from "@/lib/supabase/server";
import { metaString } from "@/lib/utils";
import { MinimalUser } from "@/types";

export default async function NavServer() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const minimal: MinimalUser | null = user
    ? {
        id: user.id,
        email: user.email,
        avatar_url:  metaString(user.user_metadata, "avatar_url"),
        full_name: metaString(user.user_metadata, "full_name"),
      }
    : null;

  return <NavClient user={minimal} />;
}
