import { z } from "zod";

// NOTE: These schemas use the modern Zod v4 style (z.email/z.url/z.uuid via .pipe)
// Importance: avoids deprecated APIs, keeps validation future‑proof and consistent across the app.

// Common validation schemas
// Validates end‑user email input with a required constraint first, then a strict email check
// Importance: prevents bad data from reaching auth flows and external services.
export const emailSchema = z.string().min(1, "Email is required").pipe(z.email("Invalid email address"));

// Validates Supabase user IDs as UUIDs
// Importance: protects DB queries and webhook flows from malformed identifiers.
export const userIdSchema = z.string().min(1, "User ID is required").pipe(z.uuid("Invalid user ID format"));

// Validates Stripe price IDs are present (existence only; existence checked against Stripe in the API)
// Importance: ensures request is well‑formed before hitting Stripe.
export const priceIdSchema = z.string().min(1, "Price ID is required");

// Checkout request validation
// API input contract for /api/checkout
// Importance: single source of truth for the route handler, keeps request validation centralized.
export const checkoutRequestSchema = z.object({
  priceId: priceIdSchema,
});

export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;

// License validation
// Basic license key constraints (server generates actual keys)
// Importance: prevents obviously invalid values in any future user‑submitted contexts.
export const licenseKeySchema = z
  .string()
  .min(10, "License key must be at least 10 characters")
  .max(100, "License key too long");

// Profile update validation
// Profile update payload validation
// Importance: guards profile writes and ensures URLs/emails use correct formats.
export const profileUpdateSchema = z.object({
  full_name: z.string().min(1, "Full name is required").max(100, "Full name too long").optional(),
  avatar_url: z.string().pipe(z.url("Invalid avatar URL")).optional(),
});

export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;

// Generic API response validation
// Generic API response contract (optional helper for consumers/tests)
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
});

// Stripe webhook validation
// Example shape for webhook validation (we manually validate signature/body in the handler)
export const stripeWebhookSchema = z.object({
  body: z.string().min(1, "Webhook body is required"),
  signature: z.string().min(1, "Stripe signature is required"),
});

// Helper function to validate request body
// Parses and validates JSON body against a Zod schema
// Importance: ensures API routes only process known‑good inputs.
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const body = await request.json();
    const validatedData = schema.parse(body);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Validation failed: Invalid request data" };
    }
    return { success: false, error: "Invalid JSON in request body" };
  }
}

// Helper function to validate query parameters
// Parses and validates URLSearchParams against a Zod schema
// Importance: protects read endpoints that rely on query strings.
export function validateQueryParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: string } {
  try {
    const params = Object.fromEntries(searchParams.entries());
    const validatedData = schema.parse(params);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Validation failed: Invalid query parameters" };
    }
    return { success: false, error: "Invalid query parameters" };
  }
}
