// Comprehensive type definitions for the SmartKeys application
// Importance: Provides type safety across all components, API routes, and database operations

// User-related types
export type MinimalUser = {
  id: string;
  email?: string | null;
  avatar_url?: string | null;
  full_name?: string | null;
};

export type User = {
  id: string;
  email: string;
  avatar_url?: string | null;
  full_name?: string | null;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  full_name?: string | null;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
};

// License-related types
export type LicenseStatus = "active" | "inactive" | "revoked" | "expired";
export type LicenseSource = "stripe" | "manual" | "test";

export type License = {
  id: string;
  user_id: string;
  license_key: string;
  status: LicenseStatus;
  source: LicenseSource;
  external_id?: string | null;
  created_at: string;
  updated_at: string;
};

export type Activation = {
  id: string;
  license_id: string;
  device_id: string;
  device_name: string;
  activated_at: string;
  created_at: string;
};

export type LicenseWithActivation = License & {
  activation: Activation | null;
};

// API Response types
export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  details?: string;
};

export type ApiErrorResponse = {
  success: false;
  error: string;
  message: string;
  code?: string;
  details?: string;
};

export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
};

// Stripe-related types
export type StripePrice = {
  id: string;
  active: boolean;
  currency: string;
  unit_amount: number;
  recurring?: {
    interval: "day" | "week" | "month" | "year";
    interval_count: number;
  } | null;
};

export type StripeCheckoutSession = {
  id: string;
  url: string | null;
  status: "open" | "complete" | "expired";
  payment_status: "paid" | "unpaid" | "no_payment_required";
  client_reference_id?: string;
  metadata?: Record<string, string>;
};

export type StripeWebhookEvent = {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
  created: number;
};

// Error types
export type ErrorType =
  | "validation"
  | "authentication"
  | "authorization"
  | "database"
  | "stripe"
  | "license"
  | "unexpected"
  | "async";

export type ErrorTestResult = {
  status?: number;
  data?: unknown;
  error?: string;
  timestamp: string;
};

// Form and validation types
export type CheckoutRequest = {
  priceId: string;
};

export type ProfileUpdate = {
  full_name?: string;
  avatar_url?: string;
};

export type LicenseActivationRequest = {
  licenseKey: string;
  deviceId: string;
  deviceName: string;
};

export type LicenseVerificationRequest = {
  licenseKey: string;
};

// Component prop types
export type CheckoutButtonProps = {
  priceId: string;
  children: React.ReactNode;
};

export type TestErrorComponentProps = {
  onError?: (error: Error) => void;
};

export type ErrorBoundaryProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
};

// Database query result types
export type DatabaseResult<T> = {
  data: T | null;
  error: {
    message: string;
    code?: string;
    details?: string;
  } | null;
};

// Environment variable types
export type EnvironmentVariables = {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_PUBLISHABLE_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  NODE_ENV: "development" | "production" | "test";
};

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// HTTP status codes
export type HttpStatusCode = 200 | 201 | 204 | 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500 | 502 | 503;

// Rate limiting types
export type RateLimitConfig = {
  maxRequests: number;
  windowMs: number;
  message: string;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetTime: number;
};
