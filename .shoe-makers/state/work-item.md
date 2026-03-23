# Surface Permission Violations as Structured Findings

skill-type: implement

## Context

Permission violation detection exists (`src/verify/detect-violations.ts`) and is called during setup (`src/setup.ts:87-89`) for critique actions. Currently, violations are only surfaced as text in the critique prompt (`src/prompts/reactive.ts:28-29`), relying on the LLM reviewer to notice and manually write a finding.

The spec says (`.shoe-makers/invariants.md` section 1.5):
> "Verification checks: scope violation, test quality, invariant gaming, spec alignment, regressions"
> "If verification finds blocking issues, they must be fixed before new work starts"

Currently, if the LLM reviewer doesn't notice the prompt warning, a permission violation can slip through. Making violations into structured finding files makes the quality gate deterministic.

## What to Build

When `detectPermissionViolations()` returns violations during setup, **automatically write a finding file** in `.shoe-makers/findings/` with the violations listed. This finding should NOT be auto-resolved — it requires a human or fix-critique elf to address it.

### Implementation Plan

1. **In `src/setup.ts`** (after line 89), add logic to write a finding file when violations are detected:

```typescript
if (permissionViolations && permissionViolations.length > 0) {
  await writePermissionViolationFinding(repoRoot, permissionViolations);
}
```

2. **Create a new function** `writePermissionViolationFinding` in `src/verify/detect-violations.ts` (or a new file `src/verify/violation-findings.ts` to keep detect-violations pure):

```typescript
export async function writePermissionViolationFinding(
  repoRoot: string,
  violations: string[],
): Promise<string> {
  const findingsDir = join(repoRoot, ".shoe-makers", "findings");
  await mkdir(findingsDir, { recursive: true });

  // Generate filename with date and sequence number
  const date = new Date().toISOString().slice(0, 10);
  const filename = `permission-violation-${date}.md`;
  const filepath = join(findingsDir, filename);

  const content = `# Permission Violation Detected\n\n` +
    `The previous elf modified files outside their permitted scope:\n\n` +
    violations.map(f => `- \`${f}\``).join("\n") + "\n\n" +
    `This was detected automatically by the setup script.\n`;

  await writeFile(filepath, content);
  return filename;
}
```

3. **Add a deduplication check** — don't write a new finding if one already exists for the same violations. Check for existing `permission-violation-*.md` files that aren't resolved.

### Patterns to Follow

- The existing `archiveResolvedFindings` in `src/skills/assess.ts` shows how findings are managed
- The `RESOLVED_PATTERN` in `src/state/world.ts:94` shows how resolved findings are detected
- Keep the function pure where possible — `writePermissionViolationFinding` takes explicit arguments, no global state
- Use `mkdir` with `{ recursive: true }` for the findings directory

### Tests to Write

In a new or existing test file:

1. **Test that `writePermissionViolationFinding` creates a file** with the expected content containing the violation paths
2. **Test that the finding file is NOT marked as resolved** (doesn't match `RESOLVED_PATTERN`)
3. **Test deduplication** — calling twice with the same violations shouldn't create a duplicate finding
4. **Test that `countUnresolvedCritiques`** (in `src/state/world.ts`) does NOT count permission violation findings (they start with `permission-violation-`, not `critique-`) — OR decide whether permission violation findings should also be counted as unresolved critiques. Check how the tree condition works.

**Important design decision**: The tree's `unresolved-critiques` condition in `src/state/world.ts:96-110` only counts files starting with `critique-`. Permission violation findings should either:
- (a) Start with `critique-` so they block via the existing tree condition, OR
- (b) Start with `permission-violation-` and add a new tree condition for them

Option (a) is simpler and more correct — a permission violation IS a blocking critique.

### What NOT to Change

- Do not modify `src/verify/detect-violations.ts` core detection logic — it's correct
- Do not modify `src/prompts/reactive.ts` — keep the prompt warning as well (belt and suspenders)
- Do not modify the behaviour tree — use the existing `unresolved-critiques` condition
- Do not modify `.shoe-makers/invariants.md`

## Decision Rationale

Chosen over candidate 1 (arc narrative test) because the instructions prefer implementation over test coverage at the innovation tier. Chosen over candidate 2 (invariant re-check) because permission violations are a more concrete, self-contained improvement with clear impact on quality gates. Candidate 2 would require more careful design around what "re-check invariants" means at verify time. Candidate 4 (CHANGELOG) is lower impact. Candidate 5 (test quality checker) is more speculative.
