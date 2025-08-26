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
