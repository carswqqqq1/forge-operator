# Project Handoff

## Current Repo State

This repository is currently on `main` and matches remote commit:

- `9e22e92` `Add complete local Manus agent: Ollama + Claude + NVIDIA with full UI, tools, and tests`

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
3. Verify all sidebar routes and buttons actually work.
4. Validate Ollama, Claude, and NVIDIA flows from the live UI.
5. Clean up any stale leftover directories from the old monorepo approach if they are no longer needed.

## Notes For The Next AI

- Do not assume the old Next.js `apps/web` app is still the main product.
- The repo README now describes the local Manus agent implementation and is consistent with the current root package scripts.
- The screenshot folder is untracked local reference material unless the user asks to commit it.
- The user wants the UI and behavior to get as close to Manus as safely possible.
