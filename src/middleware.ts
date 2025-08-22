import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const userLoggedIn = async () => {
  // Create Supabase client
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) return true;
  return false;
};

/**
 * Declare protected route groups.
 * - PAGES: redirect to /signin when unauthenticated
 * - APIS:  respond 401 JSON when unauthenticated
 *
 * Adjust these lists as your app grows.
 */
const PROTECTED_PAGE_PREFIXES = [
  "/dashboard",
  "/account",
  "/billing",
  "/pricing",
  // add more page prefixes here …
];

const PROTECTED_API_PREFIXES = [
  "/api/profile",
  // "/api/licenses",
  "/api/checkout",
  // add more api prefixes here …
];

/** Quick helpers */
function startsWithAny(pathname: string, prefixes: string[]) {
  return prefixes.some(p => pathname === p || pathname.startsWith(p + "/"));
}

export async function middleware(req: NextRequest) {
  const isLoggedIn = await userLoggedIn();
  const { pathname, search } = req.nextUrl;

  const isProtectedPage = startsWithAny(pathname, PROTECTED_PAGE_PREFIXES);
  const isProtectedApi = startsWithAny(pathname, PROTECTED_API_PREFIXES);

  // Don’t try to protect the Stripe webhook or Next internals
  if (pathname.startsWith("/api/stripe/webhook") || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  // If not protected, continue
  if (!isProtectedPage && !isProtectedApi) {
    return NextResponse.next();
  }

  // If user is logged in, continue
  if (isLoggedIn) {
    return NextResponse.next();
  }

  // Unauthenticated handling
  if (isProtectedApi) {
    // APIs: return 401 JSON
    return new NextResponse(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  // Pages: redirect to /signin with ?redirect=<original>
  const to = new URL("/signin", req.url);
  to.searchParams.set("redirect", pathname + search);
  return NextResponse.redirect(to);
}

/**
 * Use a matcher that covers your protected areas.
 * You can keep this broad and still branch inside middleware.
 * Add/remove entries as you grow protected routes.
 */
export const config = {
  matcher: [
    // Protected pages
    "/dashboard/:path*",
    "/pricing/:path*",
    // "/billing/:path*",

    // Protected APIs
    "/api/profile/:path*",
    "/api/checkout/:path*",
    // "/api/licenses/:path*",
  ],
};
