export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Checkout route: creates a Stripe Checkout Session for a given priceId
// Importance: core purchase entry point; hardened with validation and rate limiting.
// Note: we return a consistent { success, data | error } envelope via api-utils helpers.
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { APP_URL } from "@/lib/config";
import { validateRequestBody, checkoutRequestSchema } from "@/lib/validation";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  serverErrorResponse,
  // requireEnvVar,
  checkRateLimit,
  isValidUUID,
} from "@/lib/api-utils";

export async function POST(req: Request) {
  try {
    // Rate limiting
    const clientIP = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    if (!checkRateLimit(`checkout:${clientIP}`, 5, 60000)) {
      // 5 requests per minute
      return errorResponse("Too many requests. Please try again later.", 429);
    }

    // Validate request body
    const validation = await validateRequestBody(req, checkoutRequestSchema);
    if (!validation.success) {
      return errorResponse(validation.error);
    }

    const { priceId } = validation.data;

    // Debug logging (safe; avoids leaking secrets)
    console.log("Checkout request:", { priceId, timestamp: new Date().toISOString() });

    // Validate price ID is not empty
    if (!priceId || priceId.trim() === "") {
      console.error("Checkout error: Empty price ID");
      return errorResponse("Invalid price ID", 400);
    }

    // Validate user authentication
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return unauthorizedResponse();
    }

    // Validate user ID format
    if (!isValidUUID(user.id)) {
      return errorResponse("Invalid user ID format", 400);
    }

    // Validate price exists and is active
    let price;
    try {
      price = await stripe.prices.retrieve(priceId);
      if (!price.active) {
        console.error("Checkout error: Price is not active", { priceId });
        return errorResponse("Price is not active");
      }
    } catch (stripeError) {
      console.error("Checkout error: Stripe price retrieval failed", { priceId, error: stripeError });
      return errorResponse("Invalid price ID or Stripe configuration error");
    }

    const mode = price.type === "recurring" ? "subscription" : "payment";

    const session = await stripe.checkout.sessions.create({
      mode,
      customer_email: user.email ?? undefined,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { user_id: user.id },
      success_url: `${APP_URL}/dashboard/licenses?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/pricing`,
    });

    if (!session.url) {
      return serverErrorResponse("Failed to create checkout session");
    }

    return successResponse({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return serverErrorResponse();
  }
}
