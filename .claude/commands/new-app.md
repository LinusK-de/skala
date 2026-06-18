---
description: Scaffold a brand-new app from this template
---

Create a new app from this template named: **$ARGUMENTS**

Steps:

1. Derive a slug (kebab-case) and a scheme (lowercase, no dashes) from the name;
   confirm them with me before proceeding.
2. From the project root run:
   `node scripts/init-app.mjs --name "<Name>" --slug <slug> --scheme <scheme>`
3. Run `npm install`, then `npm run db:generate`.
4. Verify: `npm run typecheck` and `npm run lint`.
5. Replace the placeholder assets in `assets/images/` (icon, splash, adaptive
   icons) — they are still Satura's and must not ship.
6. Rewrite the "What this is" paragraph in `AGENTS.md` and the title in
   `README.md` for the new app.
7. Commit, then create the GitHub repo (see `README.md` → "Create a new app").

Then stop and wait before building features.
