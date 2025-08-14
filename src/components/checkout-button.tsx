"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CheckoutButton({ priceId, children }: { priceId: string; children: React.ReactNode }) {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      className="w-full cursor-pointer"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ priceId }),
        });
        const { url } = await res.json();
        window.location.href = url;
      }}
    >
      {children}
    </Button>
  );
}
