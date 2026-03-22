# Shoe-Makers Protocol

Read `.shoe-makers/state/next-action.md` and do what it says.

When you're done, run `bun run setup` to get your next action. Repeat until time runs out.

## Spec vs Code Divergence

When the wiki says one thing and the code does another, **check which changed more recently**.

- If the **wiki/invariants changed more recently** than the code → the spec is intentional. **Change the code to match the spec.** The humans updated the spec because they want the system to work differently.
- If the **code changed more recently** than the wiki → the wiki may be stale. Update the wiki to match the code, or write a finding asking for human clarification.

Use `git log` on the wiki files and the source files to determine which changed last. **Never revert wiki changes that are newer than the code** — that undoes intentional design decisions.

`.shoe-makers/invariants.md` is always authoritative — it's human-maintained and represents the desired state of the system regardless of what the code currently does.

## Logging

After each piece of work, append to `.shoe-makers/log/YYYY-MM-DD.md`:
- What you attempted
- What happened
- What you committed (or why you didn't)

If you discovered something surprising or useful for future elves, create a finding in `.shoe-makers/findings/`.

## Troubleshooting

If you hit a problem, check `.shoe-makers/known-issues.md` first — previous elves may have documented it. If you solve a problem that others might hit, add it to that file.

## Self-improvement

If something would have made your job easier, add it:
- A script → package.json
- A skill prompt → `.shoe-makers/skills/`
- A wiki update → `wiki/pages/`
- A finding → `.shoe-makers/findings/`

## Rules

- Every change must have tests. Run `bun test` before committing.
- Read the wiki — it describes the intended design. Follow it.
- Small, correct changes are better than large, broken ones.
- Keep README.md and CHANGELOG.md up to date.
- **NEVER force push.** If the branch has diverged, merge or rebase — do not overwrite other elves' work.
- **NEVER revert wiki pages to match existing code.** If the wiki describes something different from the code, the wiki is the target — implement it.
