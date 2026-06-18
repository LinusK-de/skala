---
description: Propagate a cross-cutting decision to the app-template repo so all future apps inherit it
---

The council or a review decided something that should apply to ALL apps, not just
this one:

**$ARGUMENTS**

Propagate it to the template (`Linus-def/app-template`):

1. **Write it down as an ADR.** Draft an entry for `docs/DECISIONS.md`:
   Context → Decision → Consequences, with the next `DECISION-NNNN` number.
2. **Locate the template checkout.** Prefer the local clone at
   `D:\Coding\Apps\_template`; if it isn't there, `gh repo clone Linus-def/app-template`
   into a working folder. Pull the latest `main`.
3. **Branch:** `git checkout -b decision/<short-slug>`.
4. **Apply the change** in the template: update the relevant code/components AND
   the written rule (the design section of `AGENTS.md` and/or `docs/DECISIONS.md`).
   Keep it small and reviewable.
5. **Gate:** `npm run typecheck && npm run lint && npm run format:check` — all green.
6. **Ship for review:** commit, `git push -u origin decision/<slug>`, then
   `gh pr create` describing the decision and linking the ADR.
7. **Apply locally too:** if THIS app is affected, make the same change here as a
   normal `/feature` step.

Report the PR link and the ADR entry. New apps generated after the PR merges
inherit the rule automatically.
