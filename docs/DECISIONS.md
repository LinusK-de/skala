# Architecture & Design Decisions (ADR log)

Cross-cutting decisions that apply to **every app** built from this template. The
product council (`/idea`) and holistic reviews (`/app-review`) read this file;
when they decide something template-level, `/template-change` appends an entry
here and opens a PR. Newest at the bottom.

Each entry: **Context → Decision → Consequences.**

---

## DECISION-0001 — Light + dark parity; prefer routed pages over low-contrast modals

**Status:** adopted

**Context.** The design language ships light and dark themes that are tuned
independently. Transient surfaces (modals, popups, toasts) that look fine in light
mode can lose contrast or context in dark mode — a floating panel over the
true-black canvas — so a pattern that "works" may only ever have been checked in
one scheme.

**Decision.** Every UI must be verified in BOTH light and dark mode before it
ships. When a transient surface would lose contrast or context in either scheme,
prefer a **routed page** (full background, full contrast in both schemes, keeps
navigation context) over a modal/popup. Modals stay fine for short, high-contrast
confirmations.

**Consequences.** The `ux-designer` agent reviews both schemes by default and
routes contrast-sensitive flows to pages. New apps inherit this rule via the
template; existing apps adopt it on their next relevant change.
