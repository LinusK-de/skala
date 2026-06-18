# The Developer-Team Workflow

The goal of this setup is to build apps with AI the way a **small, disciplined
team** does — not by one-shotting a whole app from a single prompt. A team is
good because work is **debated, planned, split small, reviewed, verified, and
gated** before it lands. This document explains how we reproduce each of those
roles with Claude Code.

## Why not one-shot?

A single giant generation produces a feature nobody questioned, code nobody read,
bugs nobody caught — that may not even run. The fix is the same loop human teams
use:

```
idea → council (vote) → plan → build one small step → review → verify → commit + push → CI gate
  ▲                                                                                        │
  └──────────────────────────────────────── fix findings ◄──────────────────────────────────┘
```

Every box is small enough to understand. Bad ideas die in the council before they
cost any code; mistakes are caught one step from where they were made, not buried
under a thousand lines.

## The roles, and who plays them

| Role           | Played by                                                             | What it does                                              |
| -------------- | --------------------------------------------------------------------- | --------------------------------------------------------- |
| **Council**    | `/idea` → product-strategist · ux-designer · staff-engineer · skeptic | Debate & vote on an idea BEFORE building                  |
| **Planner**    | `/feature`, or the `Plan` agent                                       | Breaks the agreed scope into 3–7 small, committable steps |
| **Builder**    | Claude in the main session                                            | Implements ONE step, respecting the layer boundaries      |
| **Reviewer**   | `code-reviewer` agent, or `/code-review`                              | Skeptical second pair of eyes on the diff                 |
| **App review** | `/app-review` → the same expert panel                                 | Looks over the WHOLE app, not just a diff                 |
| **Verifier**   | `/verify`, `/run`, Expo Go                                            | Confirms the app actually builds and behaves              |
| **CI gate**    | `.github/workflows/ci.yml`                                            | Re-runs typecheck + lint + format on every push/PR        |
| **Lead**       | You (Linus)                                                           | Approves the verdict and each step; final say             |

No single agent both proposes and blesses its own work — that separation is the
whole point.

## Step 0 — the product council (`/idea`)

Before a non-trivial feature is built, the team decides whether it _should_ be.
Run **`/idea <the idea>`**. Four experts assess it in parallel, each from its own
lens, and each ends with a one-line **VOTE**:

- **product-strategist** — is it needed? for whom? novel, or bloat?
- **ux-designer** — does it fit the design language, in BOTH light and dark mode?
- **staff-engineer** — feasible? simplest shape? Expo Go limits? architecture fit?
- **skeptic** — the strongest honest case _against_ it.

The chair (main session) tallies the votes, resolves the disagreements, and
issues a verdict: **BUILD**, **BUILD WITH CHANGES** (a trimmed scope), or
**REJECT**. Only an approved, scoped idea moves on to `/feature`. If the council
surfaces a rule that should hold for every app, it's tagged `TEMPLATE-LEVEL` and
routed to `/template-change`.

## The loop, step by step

1. **Council** — `/idea <idea>`. The team votes; you approve the verdict.
2. **Plan** — `/feature <agreed scope>` creates a branch and proposes small steps,
   then stops.
3. **Build one step** — smallest change that completes it. Logic in `lib/`, data
   in `@/db`, UI in `components/`/`app/`.
4. **Review** — `/ship` (or `/code-review`). The `code-reviewer` reads the diff
   against `AGENTS.md`. Findings get fixed, not bypassed.
5. **Verify** — typecheck + lint green; for UI, run it in Expo Go (`npm start`).
6. **Push** — commit the step and push it to the feature branch; a draft PR
   collects the steps and CI runs on every push.
7. **Merge** — when the feature is done and CI is green, **`/merge`** squash-merges
   the PR into `main` and deletes the branch. Nothing reaches `main` except a
   green, reviewed PR.
8. **Repeat** for the next feature. Periodically, **`/app-review`** over the whole app.

Claude runs all the Git/PR mechanics; you review the diff on github.com and say
merge. New to Git? See `docs/GITHUB.md` — you don't run the commands.

## Cross-cutting decisions → the template

Some decisions aren't about one feature — they're rules that should hold for
**every** app (e.g. "a low-contrast modal in dark mode should be a routed page").
When the council or an `/app-review` reaches one:

1. It's recorded as an ADR in `docs/DECISIONS.md` (Context → Decision → Consequences).
2. **`/template-change <decision>`** applies it to the `app-template` repo on a
   branch, runs the gate, and opens a PR.
3. Once merged, every app generated afterwards inherits the rule automatically.

This is how the design language and architecture stay consistent across a growing
family of apps instead of drifting app by app.

## How to use it day to day

- Float an idea: **`/idea Add a weekly summary email`** → the team votes
- Build the approved scope: **`/feature <scope>`**
- Before every commit: **`/ship`**
- Look over the whole app: **`/app-review`**
- Promote a rule to all apps: **`/template-change <decision>`**
- Spin up a new app: **`/new-app Body Track`**

## Scaling up (optional, for big changes)

For large or risky work you can widen the panel — more reviewers, each on a
distinct lens (correctness, security, simplicity), or parallel explorers mapping
the code before a refactor. Keep the same discipline: deliberate, small steps,
independent review, verify, gate. Don't let scale turn back into one-shotting.

## The non-negotiables

- **Decide before building.** Non-trivial ideas survive the council first.
- **Small steps.** If a diff is too big to read, it's too big.
- **Review is separate from writing.** Always a second pass before commit.
- **It must run.** Typecheck + lint green; UI confirmed in light AND dark mode.
- **Rules are shared.** Cross-cutting decisions go to the template, not one app.
- **The lead approves.** You see and understand every change.
