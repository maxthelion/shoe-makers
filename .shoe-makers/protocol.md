# Shoe-Makers Protocol

Read `.shoe-makers/state/next-action.md` and do what it says.

When you're done, run `bun run setup` to get your next action. Repeat until time runs out.

## Spec vs Code Divergence

When the wiki says one thing and the code does another, **check which changed more recently** using `git log`.

- If the **wiki/invariants changed more recently** → the spec is intentional. **Change the code to match.** The humans updated the spec because they want the system to work differently.
- If the **code changed more recently** → the wiki may be stale. Update the wiki, or write a finding asking for clarification.
- If you find **code with no corresponding invariant** → write a finding suggesting what the invariant should be. The prioritise elf may add it to `invariants.md`.

`.shoe-makers/invariants.md` is always authoritative — it represents the desired state regardless of what the code currently does.

## Logging

After each piece of work, append to `.shoe-makers/log/YYYY-MM-DD.md`:
- What you attempted
- What happened
- What you committed (or why you didn't)

If you discovered something surprising or useful for future elves, create a finding in `.shoe-makers/findings/`.

## Troubleshooting

If you hit a problem, check `.shoe-makers/known-issues.md` first. If you solve a new problem, add it to that file.

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
- **NEVER force push.**
- **NEVER revert wiki pages to match existing code.** The wiki is the target — implement it.
