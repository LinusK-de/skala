# How we use Git & GitHub (the short version)

You don't need to run any Git commands — Claude does. This page explains what's
happening so you can follow along and review with confidence.

## The five words that matter

- **Commit** — a saved snapshot of the code with a message ("Add weight chart").
  History is just a list of commits.
- **Branch** — a parallel line of work. `main` is the real app; a feature is built
  on its own branch so `main` never breaks while the work is half-done.
- **Push** — upload commits from this computer to GitHub.
- **Pull request (PR)** — "please merge this branch into main." It shows the exact
  diff, runs CI, and is where review happens. Nothing lands on `main` except
  through a PR.
- **Merge** — accept the PR; the branch's work becomes part of `main`.

## The flow (who does what)

1. `/idea` — the council votes on an idea (optionally filed as a GitHub Issue).
2. `/feature` — Claude makes a branch, builds it step by step, and opens a PR.
3. CI runs on the PR automatically (typecheck, lint, format). Green = safe.
4. **You** open the PR on github.com and look at the diff — that's your review.
   Claude also summarizes it in plain words.
5. `/merge` — once CI is green and you're happy, the PR is squash-merged into
   `main` and the branch is deleted.

Day to day you really do two things: **float ideas**, and **glance at a PR and say
"merge".**

## Why bother (vs. committing straight to main)

- **`main` always works.** Broken or half-finished work stays on a branch.
- **You can SEE every change** as a clean visual diff before it becomes real.
- **CI is a safety net** — mistakes are caught before they land.
- **History explains itself** — each PR is one titled, reviewable change you can
  undo later if you ever need to.

## What GitHub does for us automatically

- **CI** (`.github/workflows/ci.yml`) — checks every PR.
- **Dependabot** (`.github/dependabot.yml`) — opens PRs to keep dependencies and
  GitHub Actions up to date.
- **PR / Issue templates** — every PR and every idea has a consistent shape.

## If something goes wrong

Tell Claude in plain words: "undo the last change", "this PR has a conflict",
"go back to how it was yesterday". Git can undo almost anything — you don't need
to know the commands, just say what you want to happen.
