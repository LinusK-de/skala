---
description: Holistic team review of the whole app (not just a diff)
---

Run a holistic team review of the WHOLE app — not a single diff. Launch these
subagents in parallel and point each at the repo:

- `product-strategist` — is the app coherent? feature bloat? gaps in the core journey?
- `ux-designer` — design-language consistency; verify EVERY screen in light AND
  dark mode (contrast, modals/popups, empty states); flag anything that should be
  a template rule.
- `staff-engineer` — architecture health (layer boundaries, dead code, oversized
  files), Expo Go safety, missing migrations.
- `code-reviewer` — correctness hotspots across the code.

Synthesize everything into ONE prioritized list, each item as
`severity (blocker/should/nit) — area — finding`. Mark any finding that is really
a cross-cutting rule as a `TEMPLATE-LEVEL` candidate for `/template-change`.

Do not fix anything yet — report, then we decide together what to act on.
