"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const cb = useSearchParams().get("redirect") ?? "/dashboard";
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?redirect=${encodeURIComponent(cb)}`;

  async function sendMagicLink() {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callbackUrl },
    });
    setBusy(false);
    if (!error) router.push("/check-email");
  }

  async function signInGitHub() {
    setBusy(true);
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: callbackUrl },
    });
  }

  async function signInGoogle() {
    const cb = new URLSearchParams(window.location.search).get("redirect") ?? "/dashboard";
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?redirect=${encodeURIComponent(cb)}`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl,
        // Optional: request Google refresh token
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
  }

  return (
    <main className="px-6 py-16">
      <Card className="mx-auto max-w-md">
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@email.com"
            />
          </div>
          <Button
            className="w-full"
            onClick={sendMagicLink}
            disabled={!email || busy}
          >
            Send magic link
          </Button>
          <div className="text-center text-sm">or</div>
          <Button
            variant="outline"
            className="w-full"
            onClick={signInGitHub}
            disabled={busy}
          >
            Continue with GitHub
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={signInGoogle}
            disabled={busy}
          >
            Continue with Google
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
