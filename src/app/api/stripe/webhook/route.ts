import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateLicenseKey } from "@/lib/licenses/key";

// Always use the Node runtime for webhooks
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});

function json(data: unknown, init?:  ResponseInit) {
  return NextResponse.json(data, init);
}

/** Simple license key generator (replace with your own if you have one) */
// function makeLicenseKey(): string {
//   const raw = crypto.randomUUID().replace(/-/g, "").toUpperCase();
//   const base = raw.slice(0, 25);
//   return base.match(/.{1,5}/g)!.join("-");
// }

/** Shape we insert into your `licenses` table (adjust to your schema) */
type LicenseInsert = {
  license_key: string;
  status: string; // e.g. "active"
  source: string; // e.g. "stripe"
  stripe_session_id: string;
  stripe_customer_id: string | null;
  stripe_price_id: string | null;
  user_id: string | null;
  email: string | null;
};

export async function POST(req: Request) {
  // 1) Validate presence of signature header
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return json({ error: "missing_signature" }, { status: 400 });
  }

  // 2) Validate presence of webhook secret
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return json({ error: "server_misconfigured" }, { status: 500 });
  }

  // 3) Read raw body for signature verification
  const rawBody = await req.text();

  // 4) Verify and construct the event
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, sig, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "invalid_signature_or_payload";
    return json({ error: "invalid_signature", message }, { status: 400 });
  }

  // 5) Handle events
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Metadata in Stripe typings is Record<string, string> | null
        const md: Stripe.Metadata | null = session.metadata ?? null;

        // Identify purchaser
        const userId: string | null =
          session.client_reference_id ?? (md?.user_id ?? null);

        const email: string | null =
          session.customer_details?.email ??
          session.customer_email ??
          md?.email ??
          null;

        // Optional price tracking (depends on how you create the Checkout Session)
        const priceId: string | null = md?.price_id ?? null;

        // Create a license key
        // const licenseKey = makeLicenseKey();
        const licenseKey = generateLicenseKey();

        // Insert into Supabase with service role client
        const supabase = createAdminClient();

        const insertPayload: LicenseInsert = {
          license_key: licenseKey,
          status: "active",
          source: "stripe",
          stripe_session_id: session.id,
          stripe_customer_id:
            typeof session.customer === "string" ? session.customer : null,
          stripe_price_id: priceId,
          user_id: userId,
          email,
        };

        const { error: insertErr } = await supabase
          .from("licenses")
          .insert(insertPayload)
          .single();

        if (insertErr) {
          throw new Error(`Failed to insert license: ${insertErr.message}`);
        }

        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        // Optional: sync subscription state
        break;
      }

      case "invoice.payment_succeeded": {
        // Optional: record invoice
        break;
      }

      default: {
        // Unhandled types can be ignored or logged
        break;
      }
    }
  } catch (err: unknown) {
    // If business logic fails, return 500 so Stripe retries
    const message = err instanceof Error ? err.message : "handler_failed";
    return json({ error: "handler_failed", message }, { status: 500 });
  }

  // 6) Acknowledge receipt
  return new NextResponse(null, {
    status: 200,
    headers: { "Stripe-Webhook-Verified": "1" },
  });
}
