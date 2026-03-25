# Add partial-work.md to archive consumed files list

skill-type: bug-fix

## The bug

`src/archive/state-archive.ts:8-12` defines which state files are consumed by each action:

```typescript
const CONSUMABLE_FILES: Record<string, string[]> = {
  "execute-work-item": ["work-item.md"],
  "dead-code": ["work-item.md"],
  "prioritise": ["candidates.md"],
};
```

The newly implemented `continue-work` action consumes `partial-work.md` but isn't listed. When setup runs `archiveConsumedStateFiles(repoRoot, "continue-work")`, it returns empty and the file is never archived.

## Fix

Add `"continue-work": ["partial-work.md"]` to the `CONSUMABLE_FILES` record.

## Test

Add a test in `src/__tests__/state-archive.test.ts` following the existing pattern (e.g., the `dead-code` test at lines 52-59):

```typescript
test("archives partial-work.md when action is continue-work", async () => {
  writeFileSync(join(tmpDir, ".shoe-makers", "state", "partial-work.md"), "# Partial work");
  const archived = await archiveConsumedStateFiles(tmpDir, "continue-work");
  expect(archived.length).toBe(1);
  expect(archived[0]).toMatch(/^partial-work-/);
});
```

## Files to modify

- `src/archive/state-archive.ts` — add `continue-work` to `CONSUMABLE_FILES`
- `src/__tests__/state-archive.test.ts` — add test for continue-work archival

## Files NOT to modify

- `.shoe-makers/invariants.md` — human only
- Any wiki files

## Decision Rationale

Chosen over candidate #2 (doc-sync pure-function-agents.md) because this is a concrete code bug that breaks traceability. Doc-sync is lower priority since the system still functions correctly despite stale wiki text.
