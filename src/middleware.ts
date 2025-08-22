import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          res.cookies.set(name, value, options as CookieOptions);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (req.nextUrl.pathname.startsWith("/dashboard") && !user) {
    const url = new URL("/signin", req.url);
    url.searchParams.set("redirect", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};

// middleware.ts (temporary global probe)
// export function middleware() {
//   console.log("Middleware hit");
// throw new Error("Middleware crashed");
// }

// IMPORTANT: remove the config matcher while testing, so it runs globally
// export const config = { matcher: ["/dashboard/:path*"] };
