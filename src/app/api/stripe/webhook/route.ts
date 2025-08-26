export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Stripe webhook: validates signature and issues a license after successful checkout
// Importance: authoritative source of truth for post‑payment actions; must be deterministic and idempotent.
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateLicenseKey } from "@/lib/licenses/key";
import Stripe from "stripe";
import { PostgrestError } from "@supabase/supabase-js";

export async function POST(req: Request) {
  // Validate webhook signature header
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    console.error("webhook: missing signature header");
    return new Response("Missing signature header", { status: 400 });
  }

  // Validate webhook secret
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("webhook: missing webhook secret");
    return new Response("Server configuration error", { status: 500 });
  }

  const body = await req.text();

  // Validate body is not empty
  if (!body) {
    console.error("webhook: empty body");
    return new Response("Empty webhook body", { status: 400 });
  }

  const admin = createAdminClient();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("webhook: bad signature", err);
    return new Response("Bad signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Validate session data
    if (!session.id) {
      console.error("webhook: missing session ID");
      return new Response("Invalid session data", { status: 400 });
    }

    const paid = session.payment_status === "paid" || session.status === "complete";
    const userId = session.metadata?.user_id || session.client_reference_id;

    // Validate user ID exists and is a valid UUID
    if (!userId || typeof userId !== "string") {
      console.error("webhook: missing or invalid user ID", { sessionId: session.id });
      return new Response("Invalid user ID", { status: 400 });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      console.error("webhook: invalid UUID format", { userId, sessionId: session.id });
      return new Response("Invalid user ID format", { status: 400 });
    }

    if (paid && userId) {
      try {
        // Idempotency: skip if already processed
        const { data: existing, error: selErr } = await admin
          .from("licenses")
          .select("id")
          .eq("external_id", session.id)
          .limit(1);

        if (selErr) {
          console.error("webhook: database select error", selErr);
          return new Response("Database error", { status: 500 });
        }

        if (!existing || existing.length === 0) {
          const key = generateLicenseKey();
          // Insert new license. DB should enforce a UNIQUE INDEX on external_id for idempotency.
          // Importance: even if Stripe retries the same event, duplicates are prevented at the DB layer.
          const { error: insErr } = await admin.from("licenses").insert({
            user_id: userId,
            license_key: key,
            status: "active",
            source: "stripe",
            external_id: session.id,
          });

          if (insErr) {
            // Gracefully handle unique violation (23505) in case webhooks are delivered more than once
            // Importance: ensures webhook remains retry‑safe and we still return 2xx to Stripe.
            if ((insErr as PostgrestError).code === "23505") {
              console.warn("webhook: duplicate external_id, skipping insert", { sessionId: session.id });
              return new Response("ok");
            }
            console.error("webhook: database insert error", insErr);
            return new Response("Database error", { status: 500 });
          }

          console.log("webhook: license issued successfully", { userId, sessionId: session.id });
        } else {
          console.log("webhook: license already exists, skipping", { sessionId: session.id });
        }
      } catch (error) {
        console.error("webhook: unexpected error processing session", error);
        return new Response("Internal server error", { status: 500 });
      }
    } else {
      console.warn("webhook: skipping session - not paid or missing user ID", {
        paid,
        userId,
        sessionId: session.id,
      });
    }
  }

  return new Response("ok");
}
