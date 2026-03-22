/**
 * Template strings for the init scaffolding.
 * Extracted from init.ts to reduce file complexity.
 */

export const PROTOCOL_CONTENT = `# Shoe-Makers Protocol

Read \`.shoe-makers/state/next-action.md\` and do what it says.

When you're done, run \`bun run setup\` to get your next action. Repeat until time runs out.

## Logging

After each piece of work, append to \`.shoe-makers/log/YYYY-MM-DD.md\`:
- What you attempted
- What happened
- What you committed (or why you didn't)

If you discovered something surprising or useful for future elves, create a finding in \`.shoe-makers/findings/\`.

## Self-improvement

If something would have made your job easier, add it:
- A script → package.json
- A skill prompt → \`.shoe-makers/skills/\`
- A wiki update → \`wiki/pages/\`
- A finding → \`.shoe-makers/findings/\`

## Rules

- Every change must have tests. Run \`bun test\` before committing.
- Read the wiki — it describes the intended design. Follow it.
- Small, correct changes are better than large, broken ones.
`;

export const CONFIG_CONTENT = `# Shoe-makers configuration
# All values are optional — sensible defaults are used for anything not specified.

branch-prefix: shoemakers
tick-interval: 5
wiki-dir: wiki
assessment-stale-after: 30
max-ticks-per-shift: 10
`;

export const SCHEDULE_CONTENT = `# Working Hours

The shoemakers only work during these hours (UTC, 24h format).

start: 20
end: 6
`;

export const INVARIANTS_TEMPLATE = `# Project Invariants

Top-down. Start with what the user experiences, cascade into how it works, then architectural guarantees. Each claim is falsifiable.

---

## 1. What it does

### 1.1 Core functionality
- (Add falsifiable claims about your project here)

---

## 2. How it works

### 2.1 Architecture
- (Add architectural claims here)
`;
