# Skala — Project Guide for AI Assistants

> This file is the single source of truth for how this codebase is built.
> `CLAUDE.md` imports it, so Claude Code and any other agent read the same rules.
> Read this before changing anything.
>
> Skala was generated from our shared app template; it keeps the template's
> architecture, design language and workflow.

## ⚠️ Expo SDK is pinned to 54 — verify APIs against the versioned docs

The project is on **Expo SDK 54**, pinned to what the App Store **Expo Go** build
supports (it only runs the single latest published SDK). Do **not** bump the SDK
ahead of Expo Go. **Do not rely on memory for Expo / Expo Router / expo-sqlite
APIs.** Check the exact versioned docs at **https://docs.expo.dev/versions/v54.0.0/**
before writing code that touches the framework. Hallucinated old APIs are the #1
way this project gets junk in it.

## What this is

**Skala is a grade tracker for German students** that follows them across their
whole school career and adapts to their school type. The career is modelled as a
sequence of **stages** (e.g. _Realschule_ up to grade 10, then _Gymnasiale
Oberstufe_ 11–13) — each stage fixes its own **grading scale**: `grades_1_6`
(1–6 with +/- tendencies) or `points_0_15` (0–15 points). Students log grades per
subject, categorised (Klausur/Schulaufgabe, mündlich, Test, Projekt …) and
weighted, and the app shows trustworthy weighted **averages** per subject /
Halbjahr / stage, a "what do I need next?" target solver, and hand-crafted charts.

**Non-negotiables that shape the code:**

- **The grade math is the product.** All of it lives in `src/lib/grades/` as pure,
  exhaustively unit-tested functions (`npm test`). The two scales are **never
  silently mixed** — `scale` lives on the stage; aggregation happens within a
  scale; cross-scale only via the explicit KMK conversion table, clearly labelled.
- Every average/forecast returns a **discriminated empty result**
  (`{kind:'empty'} | {kind:'value',avg}`) — the UI renders "Kein Schnitt"/"—",
  never `NaN` or a fake `0.0`.
- **Local-first, no login, no backend, no cloud.** All data is on-device
  (expo-sqlite + Drizzle). Because there is no backup server, **JSON export/import
  (share sheet) is a first-class, free feature** — losing the phone must not lose
  years of grades.
- UI language is **German**. Free to use; a single **one-time "Pro" unlock**
  (local stub gate, no subscription) gates only optional depth (distribution chart,
  cross-subject what-if/Prognose) — the daily core is always free.
- **Out of scope (deliberately):** official Abitur/Versetzung point calculators
  and per-Bundesland rule engines (too school-specific; would feel "unfinished").
  Ship configurable weighted averages with sane defaults instead.

## Golden rule

**Clean over fast.** A small, obviously-correct change that the developer fully
understands beats a large clever one. When in doubt, **ask a specific question
instead of guessing.**

## How we work — like a team, never one-shot

We build the way a small, careful developer team does. The point is NOT "one
prompt → finished app". The point is a loop that finds and fixes mistakes:

```
idea → council (vote) → plan → build step → /ship (gate + review) → verify → push to branch → PR + CI → merge
  ↑                                                                                                          │
  └──────────────────────────────────────────────  fix findings  ◄──────────────────────────────────────────┘
```

- **Deliberate before building.** A non-trivial feature idea goes through the
  **product council** first (`/idea`): the `product-strategist`, `ux-designer`,
  `staff-engineer` and a `skeptic` assess it in parallel, vote, and the team
  reaches a verdict (build / build with changes / reject) before any code is
  written. Don't skip straight to building.
- **Plan first.** Break work into 3–7 small steps before writing code. Each step
  is one self-contained commit a human can read. (`/feature` automates this.)
- **One thing at a time.** Make the smallest change that completes the current
  step, then stop.
- **Review every step.** Before committing, run the gate (`/ship`) and let the
  `code-reviewer` agent look at the diff. Address findings; don't bypass them.
- **Verify it runs.** A change isn't done until the app actually builds/runs
  (typecheck + lint green; for UI, confirm in Expo Go).
- **Work on a branch, ship as a PR.** Each feature gets its own branch; steps are
  commits on it; the change reaches `main` through a **pull request**, not a direct
  push. CI (GitHub Actions) runs on the PR and it's merged only when green
  (`/merge`). Claude runs every git/PR command — Linus just reviews the diff and
  approves. See `docs/GITHUB.md`.
- **Review the whole app, not just diffs.** Periodically run `/app-review` — the
  same experts look over the entire app (coherence, light/dark parity, architecture
  health), not only the latest change.
- **Escalate cross-cutting decisions.** If something should hold for ALL apps (a
  design pattern, an architecture rule), record it in `docs/DECISIONS.md` and push
  it to the template with `/template-change` — don't let apps drift.
- **The developer reviews every change.** If a change is too big to read and
  understand, it is too big — split it.
- **No drive-by edits.** Never touch code unrelated to the current task.
- **No dependency changes without asking.** Do not add, upgrade, or remove
  packages unprompted. (Native modules also break Expo Go — see below.)
- **Ask when unclear.** Ambiguity → one precise question, not an assumption.

## Tech stack

- Expo (React Native) SDK 54 + **TypeScript (strict)**, **Expo Router** (file-based routing)
- **expo-sqlite + Drizzle ORM** for local storage (the on-device source of truth)
- **react-native-svg** for hand-crafted charts (no heavy chart lib; all colours from theme tokens)
- **expo-sharing + expo-file-system + expo-document-picker** for JSON backup/export & import
- **jest-expo** for unit tests — the `src/lib/grades/` math must stay green (`npm test`)
- One-time purchase via a pure gate (`lib/purchase.ts`); real store SDK (RevenueCat)
  is added only at EAS-build time — see `README.md`
- **ESLint** (eslint-config-expo) + **Prettier**
- Developed on Windows via **Expo Go**; released later via macOS / EAS.

## Architecture — layers and their boundaries

```
src/
  app/         Screens & routing only (Expo Router). Thin: read input, call db/ or lib/, render.
  components/  Pure, reusable UI. No business logic, no database access.
  lib/         ALL business logic as PURE TypeScript functions. No React, no
               database, no I/O. Same input -> same output. Trivially unit-testable.
  db/          The ONLY place that talks to the database: schema, queries, migrations.
  hooks/       React hooks — the glue between UI and db/lib.
  constants/   Static values, theme.
```

**Hard rules (these are what keep the app from rotting):**

1. Business logic lives in `lib/` as **pure functions**. Never bury a calculation
   inside a screen or component.
2. Data access happens **only** through `@/db`. UI and `lib/` never import
   `expo-sqlite` or `drizzle-orm` directly. The `db/` layer is the seam that lets
   us change storage later without touching screens, `lib/`, or components.
3. `lib/` depends on nothing app-specific — it must not import from `db/`,
   `components/`, or `app/`.
4. **Every schema change goes through a Drizzle migration.** Edit `src/db/schema.ts`,
   then run `npm run db:generate`. Never change a table shape without a migration.
   Never hand-edit generated SQL.
5. **Expo Go safety:** do not import native modules that aren't in Expo Go at
   module load. The purchase gate is a pure stub for this reason; real IAP is
   wired only in the EAS build.

## Design language & cross-cutting rules

The visual language lives in `src/constants/theme.ts` (calm neutral palettes,
charcoal ink, generous radii, color reserved for data). Two standing rules every
app inherits:

- **Light + dark parity is mandatory.** Verify every screen in BOTH schemes before
  it ships. When a transient surface (modal/popup) would lose contrast or context
  in either scheme, prefer a **routed page**. See `docs/DECISIONS.md` (DECISION-0001).
- **Cross-cutting decisions are recorded and shared.** Anything that should hold for
  every app goes in `docs/DECISIONS.md` and is propagated to the template via
  `/template-change`. The product council (`/idea`) and `/app-review` are where
  these surface.

## Code style

- TypeScript **strict** is on. Avoid `any`; if truly unavoidable, justify it in a comment.
- Prefer small pure functions. Name things for meaning (`canUse`, not `tmp`).
- Let Prettier format and ESLint lint — don't fight the tools, don't reformat by hand.
- Import from `src/` via the `@/` alias.

## Commands

| Command                | What it does                                          |
| ---------------------- | ----------------------------------------------------- |
| `npm start`            | Start the dev server (scan the QR code with Expo Go)  |
| `npm run typecheck`    | Type-check without emitting (`tsc --noEmit`)          |
| `npm run lint`         | Run ESLint                                            |
| `npm run format`       | Format the codebase with Prettier                     |
| `npm run format:check` | Check formatting without writing                      |
| `npm test`             | Run the jest unit tests (grade math in `lib/grades/`) |
| `npm run db:generate`  | Generate a migration after editing `src/db/schema.ts` |

## When you finish a step

Stop. Summarize what changed in one or two sentences. **Wait for the go-ahead**
before starting the next step.
