---
description: Run the product council on a feature idea — the team deliberates and votes before any code is written
---

A new idea has come in for this app:

**$ARGUMENTS**

Do NOT start building. The team deliberates first.

1. **Independent assessments (in parallel).** Launch these subagents at once,
   giving each the idea and pointing them at this repo:
   - `product-strategist` — needed? for whom? novel? core vs. bloat?
   - `ux-designer` — fits the design language? works in BOTH light and dark mode?
     any `TEMPLATE-LEVEL` rule?
   - `staff-engineer` — feasibility, architecture fit, Expo Go limits, simplest shape?
   - `skeptic` — the strongest case against.
2. **Tally the votes.** Collect each agent's final `VOTE:` line and summarize
   where they agree and where they clash.
3. **Chair's verdict.** Reason to a decision — votes inform it, they don't blindly
   decide it: **BUILD**, **BUILD WITH CHANGES** (state the agreed, trimmed scope),
   or **REJECT** (why). Name who needs it, what's novel, and the chosen UX shape.
4. **Route the outcome:**
   - If any agent flagged a **TEMPLATE-LEVEL** concern, capture it and recommend
     `/template-change`.
   - On BUILD / BUILD WITH CHANGES → hand the agreed scope into the `/feature`
     loop (plan → build one step → review → verify → ship).
   - On REJECT → stop and explain. Don't build.
5. **Log it (optional).** With my go-ahead, file the idea and the verdict as a
   GitHub issue (`gh issue create` using the "Feature idea" template), labeled
   `idea` plus the verdict (`approved` / `rejected` / `template-level`). This keeps
   a visible backlog.

Show me the tally and the verdict before any code is written.
