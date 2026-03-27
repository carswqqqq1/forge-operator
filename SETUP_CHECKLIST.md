# Forge Setup Checklist

This is the exact list of what you need to provide to make Forge fully work.

## 1. Base app

Copy `.env.example` to `.env.local` in the repo root:

```bash
cd /Users/carsonweso/Documents/Forge
cp .env.example .env.local
```

## 2. Supabase

Needed for:
- auth
- database
- storage
- future realtime/state sync

Grab these from your Supabase project:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Also configure in Supabase:
- Email/password auth
- Google OAuth if you want `Continue with Google`
- GitHub OAuth if you want `Continue with GitHub`
- a storage bucket for artifacts

Notes:
- The auth UI is wired.
- The storage signing route is still a stub until we connect real signed upload generation to your bucket.

## 3. Stripe

Needed for:
- subscriptions
- one-time credit packs
- hosted checkout
- billing portal
- webhook sync

Grab these from Stripe:
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_BILLING_PORTAL_CONFIGURATION_ID`

Create these Stripe Prices and copy the IDs:
- `STRIPE_PRICE_PRO_MONTHLY`
  This should be a recurring monthly price for Forge Pro.
- `STRIPE_PRICE_CREDITS_SMALL`
  This should be a one-time price for a smaller credit pack.
- `STRIPE_PRICE_CREDITS_LARGE`
  This should be a one-time price for a larger credit pack.

Important:
- Checkout is implemented.
- Portal session creation is implemented.
- Webhook verification is implemented.
- You still need to persist real Stripe `customer_id` values in your app data for the portal to fully work per user.

## 4. NVIDIA

Needed for:
- remote model routing if you want NVIDIA as the primary provider

Grab:
- `NVIDIA_API_KEY`

Important:
- The current `/api/models/validate-nvidia-key` route is only a safe format check stub right now.
- If you want true live key validation, we should add an actual provider ping next.

## 5. Ollama

Needed for:
- local fallback model execution

Grab or set:
- `OLLAMA_BASE_URL`

Typical local default:
- `http://127.0.0.1:11434`

Run locally if needed:

```bash
ollama serve
```

## 6. GitHub

Needed for:
- future repo actions
- richer project integrations
- optional authenticated workflows

Optional:
- `GitHub personal access token`

Current state:
- the app has a settings field for it
- the core GitHub repo already exists here:
  [https://github.com/carswqqqq1/forge-operator](https://github.com/carswqqqq1/forge-operator)

## 7. Local runner

Needed for:
- browser automation
- local workspace execution
- runner heartbeat

Current implementation:
- runner registration is wired
- heartbeat is wired
- tool registry exists

Run it with:

```bash
cd /Users/carsonweso/Documents/Forge
npm run dev:runner
```

Optional envs:
- `FORGE_APP_URL`
- `FORGE_RUNNER_NAME`
- `FORGE_RUNNER_HEARTBEAT_MS`

## 8. Playwright browsers

Needed for:
- real browser operator flows

Install browser binaries if missing:

```bash
npx playwright install chromium
```

## 9. Netlify

Needed for:
- production deployment

You will need:
- a working Netlify account/team
- a site linked to this repo or folder
- env vars configured in Netlify

Production-safe envs to add in Netlify:
- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_DEFAULT_MODEL_PROVIDER`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_BILLING_PORTAL_CONFIGURATION_ID`
- `STRIPE_PRICE_PRO_MONTHLY`
- `STRIPE_PRICE_CREDITS_SMALL`
- `STRIPE_PRICE_CREDITS_LARGE`
- `NVIDIA_API_KEY`
- `OLLAMA_BASE_URL` if relevant

## 10. What already works

These are already implemented:
- Manus-style landing/home shell
- auth pages
- workspace page
- run detail page
- usage page
- billing page
- settings page
- Stripe checkout route
- Stripe portal route
- Stripe webhook route
- run preview/create/approve/reject/cancel routes
- runner register/heartbeat routes

## 11. What is still demo/stubbed

These parts still need a real backend hookup:
- artifact upload signing
- persistent Stripe customer mapping
- live NVIDIA provider validation
- full approval execution state persistence
- real run/event storage in Supabase tables

## 12. Quick local run

```bash
cd /Users/carsonweso/Documents/Forge
npm install
npm run dev --workspace @forge/web
```

Then open:
- [http://localhost:3000](http://localhost:3000)
