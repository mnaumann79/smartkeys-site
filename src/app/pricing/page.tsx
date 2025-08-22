import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckoutButton } from "@/components/buttons/checkout-button";

export const metadata: Metadata = { title: "Pricing — SmartKeys" };

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "",
    highlights: ["Core autocorrect", "System-wide", "Local processing"],
    fine: "Community support",
    badge: null as string | null,
  },
  {
    name: "Pro",
    price: "$4.99",
    period: "/mo",
    highlights: ["Custom dictionary", "Cloud sync (opt-in)", "Priority updates"],
    fine: "Cancel anytime",
    badge: "Popular",
  },
  {
    name: "Lifetime",
    price: "$39",
    period: " one-time",
    highlights: ["All Pro features", "Lifetime license", "Early features access"],
    fine: "One device per license",
    badge: "Best value",
  },
];

export default async function PricingPage() {
  return (
    <main className="px-6 py-16 max-w-6xl mx-auto">
      <header className="text-center space-y-2 mb-10">
        <h1 className="text-4xl font-bold tracking-tight">Simple pricing</h1>
        <p className="text-muted-foreground">Start free. Upgrade when you’re ready.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map(p => (
          <Card
            key={p.name}
            className="flex flex-col"
          >
            <CardContent className="p-6 flex-1 flex flex-col">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{p.name}</h2>
                {p.badge && <Badge variant="secondary">{p.badge}</Badge>}
              </div>

              <div className="mt-4">
                <span className="text-4xl font-bold">{p.price}</span>
                <span className="text-muted-foreground ml-1">{p.period}</span>
              </div>

              <Separator className="my-4" />

              <ul className="space-y-2 text-sm text-muted-foreground">
                {p.highlights.map(h => (
                  <li key={h}>• {h}</li>
                ))}
              </ul>

              <div className="mt-4 text-xs text-muted-foreground">{p.fine}</div>

              <div className="mt-6">
                {p.name === "Free" ? (
                  // Anchor styled as button (no nested <button>)
                  <Button
                    asChild
                    className="w-full"
                  >
                    <Link href="/download">Download</Link>
                  </Button>
                ) : p.name === "Pro" ? (
                  <CheckoutButton priceId={process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO!}>Buy Pro</CheckoutButton>
                ) : (
                  <CheckoutButton priceId={process.env.NEXT_PUBLIC_STRIPE_PRICE_LIFETIME!}>Buy Lifetime</CheckoutButton>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mt-10 text-center text-sm text-muted-foreground">
        Windows 7+. Corrections run locally. No keystrokes leave your PC.
      </p>
    </main>
  );
}
