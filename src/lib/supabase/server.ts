import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

type CookieStore = {
  getAll(): { name: string; value: string }[];
  set?(name: string, value: string, options?: CookieOptions): void;
};

export function createClient() {
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      async getAll() {
        const store = (await cookies()) as unknown as CookieStore;
        return store.getAll();
      },
      async setAll(cookiesToSet) {
        // Only attempt to set cookies if we're in a Route Handler or Server Action
        try {
          const store = (await cookies()) as unknown as CookieStore;
          if (typeof store.set === "function") {
            cookiesToSet.forEach(({ name, value, options }) => store.set!(name, value, options));
          }
        } catch {
          // Ignore errors in Server Components where set is not available
        }
      },
    },
  });
}
