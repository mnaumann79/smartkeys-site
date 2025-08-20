// src/lib/config.ts
const env = process.env;

// Vercel-aware environment flags
export const VERCEL_ENV =
  (env.VERCEL_ENV ?? (env.NODE_ENV === "production" ? "production" : "development")) as
    | "development"
    | "preview"
    | "production";

export const IS_PROD = VERCEL_ENV === "production";
export const IS_PREVIEW = VERCEL_ENV === "preview";
export const IS_DEV = !IS_PROD && !IS_PREVIEW;

// App URL (works locally, preview, prod)
const fallbackPreview = env.VERCEL_URL ? `https://${env.VERCEL_URL}` : "http://localhost:3000";
const defaultAppUrl = IS_PROD
  ? env.NEXT_PUBLIC_APP_URL_PROD ?? fallbackPreview
  : env.NEXT_PUBLIC_APP_URL_DEV ?? "http://localhost:3000";

// Allow a generic override if you set NEXT_PUBLIC_APP_URL
export const APP_URL = env.NEXT_PUBLIC_APP_URL ?? defaultAppUrl;

// Stripe Prices
export const PRICE_PRO = IS_PROD
  ? env.NEXT_PUBLIC_STRIPE_PRICE_PRO_PROD!
  : (env.NEXT_PUBLIC_STRIPE_PRICE_PRO_DEV ?? env.NEXT_PUBLIC_STRIPE_PRICE_PRO_PROD)!;

export const PRICE_LIFE = IS_PROD
  ? env.NEXT_PUBLIC_STRIPE_PRICE_LIFETIME_PROD!
  : (env.NEXT_PUBLIC_STRIPE_PRICE_LIFETIME_DEV ?? env.NEXT_PUBLIC_STRIPE_PRICE_LIFETIME_PROD)!;

// Small helper for required server envs (use in server-only code)
export const envOrThrow = (name: keyof NodeJS.ProcessEnv) => {
  const v = env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
};
