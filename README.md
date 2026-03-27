# Forge

Forge is a premium, Manus-style operator product built as a new monorepo so the existing site in this workspace stays untouched. It ships with a pixel-close async operator UI, Stripe Hosted Checkout, a local runner, and Netlify-ready frontend deployment.

## Workspace Layout

- `apps/web`: Next.js app, App Router pages, API routes, pricing, auth, billing, and run UI
- `apps/runner`: local CLI runner that registers itself, heartbeats back to the app, and advertises supported tools
- `packages/shared`: shared product types and contracts
- `packages/agent`: planner, tool registry, approval logic, and run-loop helpers
- `packages/ui`: shared brand tokens and presentation helpers
- `supabase/schema.sql`: starter schema for profiles, runs, billing, credits, and artifacts

## What’s Implemented

- Forge brand system and logo
- pixel-close Manus-style shell and composer
- auth UI for sign-in, sign-up, and password reset
- workspace, run detail, usage, billing, settings, pricing, success, and cancel pages
- API routes for run preview/create, approval/reject/cancel, runner register/heartbeat, Stripe checkout, Stripe portal, webhook verification, upload signing stub, and NVIDIA key validation stub
- local runner registration and heartbeat loop
- Stripe Hosted Checkout integration scaffold for subscriptions and one-time credit packs

## Local Commands

```bash
npm install
npm run dev
npm run dev:runner
npm run typecheck
npm run build
```

## Environment Setup

Copy `.env.example` to `.env.local` in the repo root and add:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PRO_MONTHLY`
- `STRIPE_PRICE_CREDITS_SMALL`
- `STRIPE_PRICE_CREDITS_LARGE`
- `STRIPE_BILLING_PORTAL_CONFIGURATION_ID`
- `NVIDIA_API_KEY` if you want remote provider routing
- `OLLAMA_BASE_URL` if you want local model fallback
- `FORGE_APP_URL` if the runner should heartbeat to a non-local web URL

## Stripe Setup

1. Create a `Forge Pro` recurring monthly product and price.
2. Create two one-time credit-pack prices.
3. Add the resulting Stripe Price IDs to the env vars in `.env.local`.
4. Configure a Customer Portal and copy its configuration ID.
5. Point your Stripe webhook endpoint to `/api/stripe/webhook`.

## Netlify Setup

1. Create a new GitHub repository rooted at `forge/`.
2. Connect that repo to Netlify.
3. Use the included `netlify.toml`.
4. Add the public app, Supabase, and Stripe env vars in Netlify.
5. Keep server-only secrets protected in Netlify or Supabase function config.

## Notes

- The billing portal needs a real stored Stripe customer ID to open successfully.
- The NVIDIA validation endpoint is a safe format check stub for now, not a live provider ping.
- The upload-signing endpoint returns a storage path contract today and should be swapped to real Supabase signed uploads once the project is configured.
