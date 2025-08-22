// src/lib/config.ts

// Vercel-aware environment flags
export const VERCEL_ENV =
  (process.env.VERCEL_ENV ?? (process.env.NODE_ENV === "production" ? "production" : "development")) as
    | "development"
    | "preview"
    | "production";

export const IS_PROD = VERCEL_ENV === "production";
export const IS_PREVIEW = VERCEL_ENV === "preview";
export const IS_DEV = !IS_PROD && !IS_PREVIEW;

// App URL (works locally, preview, prod)
const fallbackPreview = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
const defaultAppUrl = IS_PROD
  ? process.env.NEXT_PUBLIC_APP_URL_PROD ?? fallbackPreview
  : process.env.NEXT_PUBLIC_APP_URL_DEV ?? "http://localhost:3000";

// Allow a generic override if you set NEXT_PUBLIC_APP_URL
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? defaultAppUrl;