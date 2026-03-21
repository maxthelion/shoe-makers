# Shoe-Makers Protocol

Read `.shoe-makers/state/next-action.md` and do what it says.

When you're done, run `bun run setup` to get your next action. Repeat until time runs out.

## Logging

After each piece of work, append to `.shoe-makers/log/YYYY-MM-DD.md`:
- What you attempted
- What happened
- What you committed (or why you didn't)

If you discovered something surprising or useful for future elves, create a finding in `.shoe-makers/findings/`.

## Self-improvement

If something would have made your job easier, add it:
- A script → package.json
- A skill prompt → `.shoe-makers/skills/`
- A wiki update → `wiki/pages/`
- A finding → `.shoe-makers/findings/`

## Troubleshooting

If you hit a problem, check `.shoe-makers/known-issues.md` first — previous elves may have documented it.

## Rules

- Every change must have tests. Run `bun test` before committing.
- Read the wiki — it describes the intended design. Follow it.
- Small, correct changes are better than large, broken ones.
- Keep README.md and CHANGELOG.md up to date.
- **NEVER force push.** If the branch has diverged, merge or rebase — do not overwrite other elves' work.
