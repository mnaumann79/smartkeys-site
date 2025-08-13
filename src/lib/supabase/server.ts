import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

type CookieStore = {
  getAll(): { name: string; value: string }[];
  set?(name: string, value: string, options?: CookieOptions): void;
};

export function createClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async getAll() {
          const store = (await cookies()) as unknown as CookieStore;
          return store.getAll();
        },
        async setAll(cookiesToSet) {
          const store = (await cookies()) as unknown as CookieStore;
          if (typeof store.set === "function") {
            cookiesToSet.forEach(({ name, value, options }) =>
              store.set!(name, value, options)
            );
          }
          // In Server Components, `set` is unavailable; safe to no-op.
        },
      },
    }
  );
}