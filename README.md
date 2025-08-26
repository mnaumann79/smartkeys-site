This is a [Next.js](https://nextjs.org) project bootstrapped with
[`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

## Stripe Webhooks (Local Development)

// Why: Needed for issuing licenses after successful checkout. Ensures end‑to‑end flow works locally.

1. Login and forward events to your local webhook route:

```bash
stripe login
stripe listen --forward-to http://localhost:3000/api/stripe/webhook
```

2. Copy the printed Signing secret (starts with `whsec_...`) and set it in `.env.local`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

3. Restart `npm run dev`.
4. Trigger an event:

```bash
# Simulate a paid session
stripe trigger checkout.session.completed
```

## Database Idempotency for Webhooks

// Why: Prevents duplicate licenses if Stripe retries delivery.

Create a unique index on `licenses.external_id` (example for Postgres/Supabase):

```sql
-- Add a unique index to ensure each Stripe session id is processed once
create unique index if not exists licenses_external_id_key on public.licenses (external_id);
```

If your insert fails with a unique violation (`23505`), the webhook handler logs and returns `200 OK` so Stripe stops
retrying.

## Error Handling Testing

// Why: Ensures the error handling system works correctly and provides proper user feedback.

### Web Interface Testing

Visit the error testing page to test all error scenarios:

```
http://localhost:3000/test-errors
```

This page provides:

- API error testing for all error types (validation, authentication, database, etc.)
- React error boundary testing
- Real-time results and status codes
- Detailed instructions for each test

### Command Line Testing

Use the provided script to test error handling from the command line:

```bash
# Test all error types
node scripts/test-errors.js

# Test specific error type
node scripts/test-errors.js --type validation

# Get endpoint information
node scripts/test-errors.js --info

# Show help
node scripts/test-errors.js --help
```

### Available Error Tests

The testing system covers:

- **Validation Errors** (400): Input validation failures
- **Authentication Errors** (401): User authentication issues
- **Authorization Errors** (403): Permission/access issues
- **Database Errors** (500): Database operation failures
- **Stripe Errors** (502): Payment processing issues
- **License Errors** (409): License-specific conflicts
- **Unexpected Errors** (500): Generic application errors
- **Async Errors**: Asynchronous operation failures

### What to Check

When testing error handling, verify:

- ✅ Proper HTTP status codes are returned
- ✅ User-friendly error messages are displayed
- ✅ Error details are logged (development mode)
- ✅ Error boundaries catch React component errors
- ✅ Console logs show structured error information
- ✅ No sensitive information is exposed in production

## Type Safety Improvements

// Why: Ensures code reliability, prevents runtime errors, and improves developer experience.

### Key Improvements Made:

1. **Comprehensive Type Definitions** (`src/types/index.d.ts`):

   - User, Profile, License, and Activation types
   - API response types with proper generics
   - Stripe integration types
   - Component prop types
   - Database and environment variable types

2. **Enhanced Validation Schemas**:

   - Replaced `z.any()` with `z.unknown()` for better type safety
   - Added proper type inference for all schemas
   - Consistent validation across all API routes

3. **Improved Component Types**:

   - Replaced `any` types with specific interfaces
   - Added proper prop types for all components
   - Enhanced error boundary types

4. **API Response Type Safety**:

   - Consistent `ApiResponse<T>` generic type
   - Proper error response types
   - Type-safe HTTP status codes

5. **Database Type Safety**:
   - Proper typing for Supabase query results
   - Type-safe license and activation handling
   - Consistent database entity types

### Type Safety Benefits:

- 🛡️ **Compile-time error detection** - Catch bugs before runtime
- 📝 **Better IntelliSense** - Improved autocomplete and documentation
- 🔄 **Refactoring safety** - Confident code changes
- 🚀 **Developer experience** - Faster development with fewer bugs
- 🏗️ **Maintainability** - Clear contracts between components

## 🚀 Implemented Features

### 🔐 **Security & Authentication**

- ✅ **Supabase Authentication**: Email magic links, GitHub, and Google OAuth
- ✅ **Route Protection**: Middleware-based authentication guards
- ✅ **Input Validation**: Comprehensive Zod schema validation
- ✅ **Rate Limiting**: Basic IP-based rate limiting for API endpoints
- ✅ **TLS Security**: Removed dangerous certificate bypass
- ✅ **Environment Variables**: Secure configuration management

### 💳 **Payment Processing**

- ✅ **Stripe Integration**: Complete checkout flow with webhooks
- ✅ **Webhook Security**: Signature validation and idempotency handling
- ✅ **License Issuance**: Automatic license generation after successful payment
- ✅ **Test Mode**: Development-friendly test card support (4242...)

### 📜 **License Management**

- ✅ **License Creation**: Test licenses for development
- ✅ **License Revocation**: Deactivate licenses with status updates
- ✅ **Device Binding**: Track device activations and unbinding
- ✅ **License Deletion**: Development-only license removal
- ✅ **License Verification**: API endpoints for license validation
- ✅ **License Activation**: Device registration and activation tracking

### 🎨 **User Interface**

- ✅ **Modern Design**: Tailwind CSS with shadcn/ui components
- ✅ **Dark/Light Mode**: Theme switching with system preference detection
- ✅ **Responsive Layout**: Mobile-first design approach
- ✅ **Loading States**: Skeleton loading and spinners
- ✅ **Error Handling**: Graceful error boundaries and user feedback
- ✅ **Copy to Clipboard**: One-click license key copying

### 🔧 **Developer Experience**

- ✅ **TypeScript**: Full type safety across the application
- ✅ **React Query**: Optimized data fetching and caching
- ✅ **Error Boundaries**: Functional component error handling
- ✅ **Debug Tools**: Development-only debugging endpoints
- ✅ **Hot Reloading**: Fast development with Turbopack
- ✅ **Code Quality**: ESLint and TypeScript strict mode

### 🗄️ **Database & Storage**

- ✅ **Supabase Database**: PostgreSQL with real-time subscriptions
- ✅ **File Storage**: Supabase Storage for file uploads
- ✅ **Row Level Security**: Database-level access control
- ✅ **Foreign Keys**: Proper relational data integrity
- ✅ **Indexes**: Optimized query performance

### 🔄 **API Architecture**

- ✅ **RESTful Endpoints**: Consistent API design patterns
- ✅ **Error Handling**: Centralized error management
- ✅ **Response Formatting**: Standardized API responses
- ✅ **Authentication**: Secure endpoint protection
- ✅ **Validation**: Request/response validation with Zod

## ⚡ Performance Optimizations

### **React Query Integration**

- ✅ **Cached Data Fetching**: Automatic caching with 5-minute stale time
- ✅ **Background Refetching**: Data stays fresh without blocking UI
- ✅ **Optimistic Updates**: Immediate UI feedback for mutations
- ✅ **Error Retry Logic**: Automatic retry for failed requests
- ✅ **DevTools**: React Query DevTools for debugging (development only)

### **Loading States & UX**

- ✅ **Skeleton Loading**: Placeholder content while data loads
- ✅ **Loading Spinners**: Consistent loading indicators
- ✅ **Error Boundaries**: Graceful error handling with retry options
- ✅ **Optimistic UI**: Immediate feedback for user actions

### **Image Optimization**

- ✅ **Next.js Image Component**: Automatic optimization for user avatars
- ✅ **Responsive Images**: Automatic sizing and format optimization
- ✅ **Lazy Loading**: Images load only when needed

### **API Optimization**

- ✅ **Dedicated Endpoints**: RESTful API for React Query
- ✅ **Proper Error Handling**: Consistent error responses
- ✅ **Authentication**: Secure data access with user validation

### **Performance Benefits**

- ⚡ **Faster Loading**: Cached data reduces API calls
- 🔄 **Real-time Updates**: Background refetching keeps data fresh
- 🎯 **Better UX**: Loading states and optimistic updates
- 📱 **Responsive**: Optimized images and mobile-friendly loading
- 🛡️ **Reliable**: Error handling and retry logic

### **React Query Configuration**

```typescript
// Default settings for optimal performance
{
  retry: 3,                    // Retry failed requests
  refetchOnWindowFocus: true,  // Keep data fresh
  staleTime: 5 * 60 * 1000,   // 5 minutes cache
  gcTime: 10 * 60 * 1000,     // 10 minutes garbage collection
}
```

## 🔌 API Endpoints

### **Authentication Endpoints**

- `POST /api/auth/signin` - Email magic link authentication
- `GET /api/auth/callback` - OAuth callback handling

### **License Management**

- `GET /api/licenses` - Fetch user's licenses
- `POST /api/licenses/test` - Create test license (dev only)
- `POST /api/licenses/[id]/revoke` - Revoke a license
- `POST /api/licenses/[id]/unbind` - Unbind device from license
- `DELETE /api/licenses/[id]/delete` - Delete license (dev only)
- `POST /api/licenses/activate` - Activate license on device
- `GET /api/licenses/verify` - Verify license validity

### **Payment Processing**

- `POST /api/checkout` - Create Stripe checkout session
- `POST /api/stripe/webhook` - Handle Stripe webhooks

### **User Management**

- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile

### **Debug Endpoints (Dev Only)**

- `GET /api/debug/env` - Check environment variables
- `POST /api/debug/checkout-test` - Test Stripe checkout
- `POST /api/test/errors` - Test error handling

## 🛠️ Development Tools

### **Error Testing**

- **Web Interface**: Visit `/test-errors` for interactive error testing
- **CLI Script**: Run `node scripts/test-errors.js` for command-line testing
- **Curl Script**: Use `scripts/test-errors-curl.sh` for bash testing

### **Stripe Webhook Testing**

```bash
# Start webhook listener
stripe listen --forward-to localhost:3001/api/stripe/webhook

# Trigger test events
stripe trigger checkout.session.completed
```

### **Database Setup**

```sql
-- Create unique index for webhook idempotency
CREATE UNIQUE INDEX licenses_external_id_idx ON licenses(external_id);
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API endpoints
│   ├── dashboard/         # Protected dashboard pages
│   ├── (auth)/           # Authentication pages
│   └── layout.tsx        # Root layout with providers
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui components
│   ├── buttons/          # Custom button components
│   └── navbar/           # Navigation components
├── lib/                   # Utility libraries
│   ├── hooks/            # React Query hooks
│   ├── validation.ts     # Zod schemas
│   ├── error-handling.ts # Error management
│   └── api-utils.ts      # API utilities
├── types/                 # TypeScript type definitions
└── scripts/              # Development scripts
```

## 🔧 Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# App
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3001
```

## 🚀 Getting Started

1. **Clone and Install**

   ```bash
   git clone <repository>
   cd smartkeys-site
   pnpm install
   ```

2. **Environment Setup**

   ```bash
   cp .env.example .env.local
   # Fill in your environment variables
   ```

3. **Database Setup**

   ```bash
   # Run the SQL commands in your Supabase project
   # Create the unique index for webhook idempotency
   ```

4. **Start Development**

   ```bash
   pnpm dev
   ```

5. **Test Features**
   - Visit `http://localhost:3001` to see the app
   - Sign in with email magic link or OAuth
   - Create test licenses in the dashboard
   - Test Stripe checkout with test cards (4242...)

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically
optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are
welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the
[Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme)
from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more
details.
