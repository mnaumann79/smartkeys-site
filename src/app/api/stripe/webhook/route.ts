export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateLicenseKey } from "@/lib/licenses/key";
import Stripe from "stripe";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");           // <-- use req.headers
  const body = await req.text();

  const admin = createAdminClient();

  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("webhook: bad signature", err);
    return new Response("Bad signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {

    const session = event.data.object as Stripe.Checkout.Session;
    const paid = session.payment_status === "paid" || session.status === "complete";
    const userId =
      (session.metadata && (session.metadata as Record<string, string>).user_id) ||
      session.client_reference_id ||
      null;

    console.log("webhook session", {
      id: session.id,
      paid,
      userId,
      mode: session.mode,
      email: session.customer_email,
    });

    if (paid && userId) {
      // idempotency: skip if already processed
      const { data: existing, error: selErr } = await admin
        .from("licenses")
        .select("id")
        .eq("external_id", session.id)
        .limit(1);
      if (selErr) console.error("select error", selErr);

      if (!existing || existing.length === 0) {
        const key = generateLicenseKey();
        const { error: insErr } = await admin.from("licenses").insert({
          user_id: userId,
          license_key: key,
          status: "active",
          source: "stripe",
          external_id: session.id,
        });
        if (insErr) {
          console.error("insert error", insErr);
          return new Response("db error", { status: 500 });
        }
        console.log("license issued", { userId, session: session.id });
      }
    } else {
      console.warn("skipping issue", { paid, userId });
    }
  }

  return new Response("ok");
}
