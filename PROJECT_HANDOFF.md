# Project Handoff

## Current Repo State

This repository is currently on `main` and matches remote commit:

- `bb7a16c` `Polish Forge auth, credits, connectors, and billing`

The project is no longer the earlier `apps/web` Forge monorepo as the primary runtime.
The authoritative app shape in the repo right now is:

- `client/`
- `server/`
- `drizzle/`
- `shared/`

There are still some older folders like `apps/` and `packages/` present locally, but the current GitHub-backed implementation is the `local-manus-agent` style app rooted at:

- [client](/Users/carsonweso/Documents/Forge/client)
- [server](/Users/carsonweso/Documents/Forge/server)
- [drizzle](/Users/carsonweso/Documents/Forge/drizzle)

## Design References

The latest screenshot reference folder added locally is:

- [manus_screenshots](/Users/carsonweso/Documents/Forge/manus_screenshots)

Important screenshots in that folder include:

- [home_page_1774568617464.png](/Users/carsonweso/Documents/Forge/manus_screenshots/home_page_1774568617464.png)
- [login_page_1774568772582.png](/Users/carsonweso/Documents/Forge/manus_screenshots/login_page_1774568772582.png)
- [manus_model_selector_dropdown_1774569512950.png](/Users/carsonweso/Documents/Forge/manus_screenshots/manus_model_selector_dropdown_1774569512950.png)
- [manus_usage_page_1774569570940.png](/Users/carsonweso/Documents/Forge/manus_screenshots/manus_usage_page_1774569570940.png)
- [manus_max_wide_research_docs_1774570235922.png](/Users/carsonweso/Documents/Forge/manus_screenshots/manus_max_wide_research_docs_1774570235922.png)

Use that folder as the primary UI reference when tightening the app toward Manus-like structure and polish.

## What Changed Recently

1. GitHub advanced beyond the earlier Forge monorepo work.
2. `main` was behind by one commit locally and has now been fast-forwarded.
3. The GitHub update replaced the prior Next.js monorepo implementation with a richer local Manus-style stack using:
   - React + Vite frontend
   - Express + tRPC backend
   - Drizzle schema and migrations
   - Ollama, Claude, and NVIDIA integrations
4. The current local work added a working Forge-flavored auth and usage layer on top of that stack.

## What Has Been Completed In This Pass

### Login / Auth

- `/login` is now a standalone page outside the main app shell.
- The auth page was rebuilt to match the Manus login structure much more closely:
  - dotted background
  - centered auth panel
  - social sign-in buttons
  - email input
  - Cloudflare Turnstile area
- Social buttons now actually work in local/dev:
  - if `VITE_OAUTH_PORTAL_URL` and `VITE_APP_ID` are configured, login can hand off to the external OAuth portal
  - if those env vars are missing, the page falls back to a local dev login endpoint that creates a session cookie and signs the user in anyway
- New backend auth endpoint:
  - `/api/auth/dev-login`
  - implemented in [server/_core/oauth.ts](/Users/carsonweso/Documents/Forge/server/_core/oauth.ts)
- Local login flow is now fully functional:
  - dev auth cookies use `SameSite=Lax` on localhost instead of an invalid insecure `SameSite=None`
  - local mode now stores users in `.forge-data` so `auth.me` can resolve signed-in sessions correctly
  - login now forces a full redirect after success so the authenticated app boots cleanly

### Messaging / Chat

- New task now routes back to the empty home composer.
- Sending a prompt from the home composer creates a new conversation and carries the pending prompt into that chat.
- Message sending now works across newly created chats, not just one manually tested thread.
- NVIDIA fallback is active when local Ollama models are missing or unavailable.
- NVIDIA fallback now instructs the assistant to answer in English by default.
- Assistant bubbles no longer show raw model names, token counts, or throughput stats.

### Credits / Tiering

- Backend credit tracking now exists in the local store:
  - credit balance
  - selected tier
  - recent usage events
- Assistant responses now consume credits based on:
  - tier
  - token count
- `Lite`, `Core`, and `Max` tier model mapping exists in [server/_core/index.ts](/Users/carsonweso/Documents/Forge/server/_core/index.ts)
- Top-right credits pill now reads from usage state instead of a hardcoded number.
- Header model selector now persists the chosen tier through the usage router.
- A new billing page was added:
  - [client/src/pages/Billing.tsx](/Users/carsonweso/Documents/Forge/client/src/pages/Billing.tsx)
  - route: `/billing`

### Connectors

- The connectors screen is no longer just a generic JSON form.
- Quick-connect cards were added for:
  - GitHub
  - Slack
  - Google Drive
  - Google Calendar
  - Stripe
  - Notion
- Clicking `Connect` now creates a starter connector record for that platform.
- Main file:
  - [client/src/pages/Connectors.tsx](/Users/carsonweso/Documents/Forge/client/src/pages/Connectors.tsx)

### Home / Shell Polish

- Home composer action icons now route to real destinations instead of doing nothing.
- Quick action chips now inject starter prompts into the composer.
- Old Local / Claude header clutter has been removed from the chat surface.
- The login logo/wordmark were tuned closer to the Manus auth reference while staying Forge-branded.

### CI / GitHub

- GitHub Actions CI was fixed.
- The workflow previously pointed at a non-existent `forge/` subdirectory and used the wrong cache path.
- It now installs and builds from the actual repo root with `pnpm`.

## Current Working Commands

From repo root:

```bash
corepack enable
corepack pnpm install
OLLAMA_HOST=0.0.0.0:11434 ollama serve
corepack pnpm dev
```

App URL:

- [http://localhost:3000](http://localhost:3000)

## Current Infra / Model Shape

The current app is designed around:

- `Ollama`
- `Claude subscription access`
- `NVIDIA support`
- `tRPC procedures`
- `Drizzle ORM schema`

Key backend files:

- [server/routers.ts](/Users/carsonweso/Documents/Forge/server/routers.ts)
- [server/ollama.ts](/Users/carsonweso/Documents/Forge/server/ollama.ts)
- [server/claude.ts](/Users/carsonweso/Documents/Forge/server/claude.ts)
- [server/nvidia.ts](/Users/carsonweso/Documents/Forge/server/nvidia.ts)
- [server/tools.ts](/Users/carsonweso/Documents/Forge/server/tools.ts)
- [server/db.ts](/Users/carsonweso/Documents/Forge/server/db.ts)
- [drizzle/schema.ts](/Users/carsonweso/Documents/Forge/drizzle/schema.ts)

Key frontend files:

- [client/src/App.tsx](/Users/carsonweso/Documents/Forge/client/src/App.tsx)
- [client/src/pages/Home.tsx](/Users/carsonweso/Documents/Forge/client/src/pages/Home.tsx)
- [client/src/pages/Login.tsx](/Users/carsonweso/Documents/Forge/client/src/pages/Login.tsx)
- [client/src/pages/Billing.tsx](/Users/carsonweso/Documents/Forge/client/src/pages/Billing.tsx)
- [client/src/pages/Connectors.tsx](/Users/carsonweso/Documents/Forge/client/src/pages/Connectors.tsx)
- [client/src/components/AppLayout.tsx](/Users/carsonweso/Documents/Forge/client/src/components/AppLayout.tsx)
- [client/src/components/AIChatBox.tsx](/Users/carsonweso/Documents/Forge/client/src/components/AIChatBox.tsx)
- [client/src/index.css](/Users/carsonweso/Documents/Forge/client/src/index.css)

## Auth / User Shape

There is also a user export that shows the expected user/auth structure:

- [users_20260327_044703.csv](/Users/carsonweso/Downloads/users_20260327_044703.csv)

Fields present there:

- `id`
- `openId`
- `name`
- `email`
- `loginMethod`
- `role`
- `createdAt`
- `updatedAt`
- `lastSignedIn`

That aligns with the user model in:

- [drizzle/schema.ts](/Users/carsonweso/Documents/Forge/drizzle/schema.ts)

## Important Reality Check

There are now two historical implementation directions in local history:

1. Earlier Forge-specific Next.js monorepo work
2. Current GitHub `local-manus-agent` style implementation

For future work, treat the second one as authoritative unless the user explicitly says to restore the old Forge monorepo approach.

## Immediate Priorities

If another AI picks this up, the best next steps are:

1. Compare all screens in [manus_screenshots](/Users/carsonweso/Documents/Forge/manus_screenshots) against:
   - [client/src/pages/Home.tsx](/Users/carsonweso/Documents/Forge/client/src/pages/Home.tsx)
   - [client/src/components/AppLayout.tsx](/Users/carsonweso/Documents/Forge/client/src/components/AppLayout.tsx)
   - [client/src/components/AIChatBox.tsx](/Users/carsonweso/Documents/Forge/client/src/components/AIChatBox.tsx)
2. Tighten the shell, composer, model selector, usage page, and auth screens toward Manus.
3. Replace the local dev-login fallback with fully real provider OAuth flows if production auth is required.
4. Validate all sidebar routes and action buttons from the live UI.
5. Continue replacing placeholder routes/pages with richer product surfaces.
6. Clean up any stale leftover directories from the old monorepo approach if they are no longer needed.

## Notes For The Next AI

- Do not assume the old Next.js `apps/web` app is still the main product.
- The repo README now describes the local Manus agent implementation and is consistent with the current root package scripts.
- The screenshot folder is untracked local reference material unless the user asks to commit it.
- The user wants the UI and behavior to get as close to Manus as safely possible.
- The repo now has meaningful uncommitted local improvements that should be reviewed before any reset or branch change.
