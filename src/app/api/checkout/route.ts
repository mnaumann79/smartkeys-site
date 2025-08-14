export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

type Body = { priceId: string };

export async function POST(req: Request) {
  const { priceId } = (await req.json()) as Body;
  if (!priceId) return NextResponse.json({ error: "priceId" }, { status: 400 });

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });

  const price = await stripe.prices.retrieve(priceId);
  const mode = price.type === "recurring" ? "subscription" : "payment";

  const session = await stripe.checkout.sessions.create({
    mode,
    customer_email: user.email ?? undefined,
    client_reference_id: user.id, // <-- backup
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { user_id: user.id }, // <-- primary
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
  });

  return NextResponse.json({ url: session.url });
}
