---
description: Run the pre-commit gate, then commit + push the current step to its branch and PR
---

Ship the current step. You should be on a feature branch, not `main`.

1. `npm run typecheck`
2. `npm run lint`
3. `npm run format:check`
4. Launch the `code-reviewer` agent on the diff (`git diff`). Fix findings — do
   not bypass them.
5. Commit with a clear, single-purpose message, then push
   (`git push -u origin HEAD` on the branch's first push, `git push` after).
6. If this branch has no PR yet, open one: `gh pr create --draft --fill`.

When everything is green, report the PR link. CI re-runs on the push; when the
feature is finished, merge with `/merge`.
