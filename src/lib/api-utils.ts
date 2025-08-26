import { NextResponse } from "next/server";

// NOTE: Centralized helpers for API responses, input sanitization, and basic rate‑limiting.
// Importance: promotes consistency, reduces boilerplate, and hardens endpoints against abuse.

// Standard API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Helper functions for consistent API responses
// Consistent success envelope for API routes
export function successResponse<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

// Consistent error envelope for API routes
export function errorResponse(message: string, status = 400): NextResponse<ApiResponse> {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function unauthorizedResponse(): NextResponse<ApiResponse> {
  return errorResponse("Authentication required", 401);
}

export function forbiddenResponse(): NextResponse<ApiResponse> {
  return errorResponse("Access denied", 403);
}

export function notFoundResponse(): NextResponse<ApiResponse> {
  return errorResponse("Resource not found", 404);
}

export function serverErrorResponse(message = "Internal server error"): NextResponse<ApiResponse> {
  return errorResponse(message, 500);
}

// Validation helper for required environment variables
// Throws if an expected secret/variable is missing at runtime
export function requireEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Rate limiting helper (basic implementation)
// Simple in‑memory rate limiter (per process)
// Importance: basic protection for sensitive endpoints in low‑traffic scenarios.
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(identifier: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

// Sanitize user input (basic XSS prevention)
// Trims and removes angle brackets to minimize trivial XSS vectors in logs/UI echo
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, "") // Remove < and >
    .trim();
}

// Validate UUID format
// UUID v1–v5 validation helper used by auth/webhook flows
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Validate email format
// Lightweight email format check for client‑side hints; server uses Zod for strict validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
