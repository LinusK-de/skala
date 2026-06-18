@AGENTS.md

## Communication

- Begin every reply with the user's name, "Linus," as the first word. This is a
  deliberate signal: as long as it shows up, the instruction is still being
  followed. If it ever silently stops appearing, that's a cue something has gone
  off the rails.

## Workflow shortcuts

- `/idea <idea>` — the product council deliberates and votes on a feature idea
  before any code is written.
- `/feature <description>` — branch, plan into small steps, build one at a time
  with review, and open a pull request.
- `/ship` — pre-commit gate (typecheck, lint, format, code review), then commit +
  push the step to its PR.
- `/merge` — merge the current PR into main once CI is green.
- `/app-review` — holistic team review of the whole app.
- `/template-change <decision>` — push a cross-cutting decision to the template.
- `/new-app <name>` — scaffold a brand-new app from this template.

See `docs/WORKFLOW.md` for the full loop and `docs/GITHUB.md` for how Git/GitHub
is used (you don't run the commands — Claude does).
