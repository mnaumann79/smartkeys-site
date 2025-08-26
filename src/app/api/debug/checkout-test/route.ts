export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { priceId } = body;

    console.log("Test checkout with price ID:", priceId);

    // Test Stripe price retrieval
    const price = await stripe.prices.retrieve(priceId);
    console.log("Price retrieved:", { id: price.id, active: price.active, type: price.type });

    // Test creating a checkout session
    const session = await stripe.checkout.sessions.create({
      mode: price.type === "recurring" ? "subscription" : "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: "http://localhost:3000/dashboard/licenses?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "http://localhost:3000/pricing",
    });

    console.log("Session created:", { id: session.id, url: session.url });

    return NextResponse.json({
      success: true,
      data: { url: session.url },
      debug: {
        priceId,
        sessionId: session.id,
        mode: price.type === "recurring" ? "subscription" : "payment",
      },
    });
  } catch (error) {
    console.error("Test checkout error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        debug: { priceId: body?.priceId },
      },
      { status: 500 }
    );
  }
}

