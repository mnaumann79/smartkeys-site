"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_URL } from "@/lib/config";
import { handleClientError } from "@/lib/error-handling";

function SignInForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [emailError, setEmailError] = useState("");
  const router = useRouter();
  const cb = useSearchParams().get("redirect") ?? "/dashboard";
  const base = APP_URL;
  const callbackUrl = `${base}/auth/callback?redirect=${encodeURIComponent(cb)}`;

  // Email validation function
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError("Email is required");
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  async function sendMagicLink() {
    if (!validateEmail(email)) {
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: callbackUrl },
      });

      if (error) {
        const errorMessage = handleClientError(error, "magic link signin");
        // You could show this error to the user
        console.error("Magic link error:", errorMessage);
      } else {
        router.push("/check-email");
      }
    } catch (err) {
      const errorMessage = handleClientError(err, "magic link signin");
      console.error("Magic link error:", errorMessage);
    } finally {
      setBusy(false);
    }
  }

  async function signInGitHub() {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: { redirectTo: callbackUrl },
      });

      if (error) {
        const errorMessage = handleClientError(error, "GitHub OAuth");
        console.error("GitHub OAuth error:", errorMessage);
      }
    } catch (err) {
      const errorMessage = handleClientError(err, "GitHub OAuth");
      console.error("GitHub OAuth error:", errorMessage);
    } finally {
      setBusy(false);
    }
  }

  async function signInGoogle() {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl,
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });

      if (error) {
        const errorMessage = handleClientError(error, "Google OAuth");
        console.error("Google OAuth error:", errorMessage);
      }
    } catch (err) {
      const errorMessage = handleClientError(err, "Google OAuth");
      console.error("Google OAuth error:", errorMessage);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mx-auto max-w-md">
      <CardContent className="p-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={e => {
              setEmail(e.target.value);
              if (emailError) validateEmail(e.target.value);
            }}
            placeholder="you@email.com"
            className={emailError ? "border-red-500" : ""}
          />
          {emailError && <p className="text-sm text-red-500">{emailError}</p>}
        </div>
        <Button
          className="w-full cursor-pointer"
          onClick={sendMagicLink}
          disabled={!email || busy}
        >
          Send magic link
        </Button>
        <div className="text-center text-sm">or</div>
        <Button
          variant="outline"
          className="w-full cursor-pointer"
          onClick={signInGitHub}
          disabled={busy}
        >
          Continue with GitHub
        </Button>
        <Button
          variant="outline"
          className="w-full cursor-pointer"
          onClick={signInGoogle}
          disabled={busy}
        >
          Continue with Google
        </Button>
      </CardContent>
    </Card>
  );
}

export default function SignIn() {
  return (
    <main className="px-6 py-16">
      <Suspense>
        <SignInForm />
      </Suspense>
    </main>
  );
}
