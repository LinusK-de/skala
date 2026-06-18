---
description: Merge the current pull request into main once CI is green
---

Merge the open PR for the current branch.

1. **Never merge red.** Check CI first: `gh pr checks` — wait until it passes. If
   anything is failing, do NOT merge; report what's failing and fix it.
2. Show me a one-line summary of what will land on `main`.
3. Squash-merge and clean up: `gh pr merge --squash --delete-branch`.
4. Sync local `main`: `git checkout main && git pull`.

Squash keeps `main` as one tidy commit per feature, so history reads as a list of
shippable changes.
