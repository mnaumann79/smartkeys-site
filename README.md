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
