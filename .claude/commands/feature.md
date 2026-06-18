---
description: Plan and build a feature on its own branch, shipped as a pull request, one reviewed step at a time
---

You are adding a feature to this app: **$ARGUMENTS**

Follow `AGENTS.md`. Work on a branch and ship it as a **pull request** — never
commit straight to `main`. Claude runs all the git/PR commands; see
`docs/GITHUB.md`.

1. **Branch.** Start from an up-to-date main:
   `git checkout main && git pull`, then `git checkout -b feature/<short-slug>`.
2. **Plan.** Break the feature into 3–7 small, self-contained steps. List them. Do
   NOT write code yet — wait for a go-ahead.
3. **Build step by step.** Implement ONE step at a time, respecting the layer
   boundaries (logic in `lib/`, data in `@/db`, UI in `components/`/`app/`). After
   each step, run `/ship` (gate + review) and fix findings, then commit and push.
4. **Open a PR early.** After the first pushed step, open a draft PR so progress
   and CI are visible: `gh pr create --draft --fill`. Later steps push to the same
   branch and update the PR automatically.
5. **Finish.** When all steps are done and green, mark the PR ready
   (`gh pr ready`) and make sure its body summarizes what changed.
6. **Merge.** Use `/merge` once CI is green and Linus is happy.

If anything is ambiguous, ask ONE precise question instead of guessing.
