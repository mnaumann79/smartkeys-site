"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { handleClientError } from "@/lib/error-handling";
import type { CheckoutButtonProps, ApiResponse } from "@/types";

// Button that initiates a server‑created Stripe Checkout Session and redirects the user
// Importance: main user entry to purchase; includes defensive checks and user‑friendly errors.

// Expected API response shape for checkout
type CheckoutResponse = ApiResponse<{ url: string }>;

export function CheckoutButton({ priceId, children }: CheckoutButtonProps) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function startCheckout() {
    if (!priceId || priceId.trim() === "") {
      setMessage("Missing or invalid price ID. Please contact support.");
      return;
    }

    setBusy(true);
    setMessage(null);

    console.log("Starting checkout with price ID:", priceId);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      // Non-2xx responses
      if (!res.ok) {
        // Try to read a structured error; fall back to status text
        let reason = res.statusText || "Unknown error";
        try {
          const body = await res.json();
          reason = body?.error ?? body?.message ?? reason;
        } catch {
          // ignore JSON parse errors
        }
        console.error("Checkout API error:", { status: res.status, reason });
        setMessage(`Checkout failed: ${reason}`);
        return;
      }

      // Successful response, validate shape
      let data: CheckoutResponse;
      try {
        data = await res.json();
      } catch {
        setMessage("Checkout failed: invalid server response.");
        return;
      }

      // Our API returns { success: true, data: { url } }
      const url = data?.data?.url;
      if (!url || typeof url !== "string") {
        setMessage("Checkout failed: no redirect URL returned.");
        return;
      }

      // Redirect to Stripe
      window.location.href = url;
    } catch (err: unknown) {
      // Network or unexpected errors
      const errorMessage = handleClientError(err, "checkout button");
      setMessage(errorMessage);
    } finally {
      // If we redirected, this line won't run; otherwise it re-enables the button
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        className="w-full cursor-pointer"
        disabled={busy}
        onClick={startCheckout}
        aria-disabled={busy}
      >
        {busy ? "Redirecting…" : children}
      </Button>

      {message && (
        <p
          role="alert"
          className="text-sm text-destructive"
        >
          {message}
        </p>
      )}
    </div>
  );
}
