# Doc-sync: Fix stale action type and tick references in wiki pages

skill-type: doc-sync

## What to fix

Two wiki pages reference action types and concepts that no longer exist. Update them to match the current architecture.

### File 1: `wiki/pages/observability.md`

**Line 29** — stale action type example:
```
- Which action the tree selected (e.g. fix-tests, implement-spec, explore, critique)
```
Change to use current action types:
```
- Which action the tree selected (e.g. fix-tests, explore, critique, execute-work-item)
```

**Line 86** — stale action type reference:
```
During **implementation** actions (implement-spec, implement-plan):
```
Change to:
```
During **execution** actions (execute-work-item):
```

**Line 15** — stale "PRIORITISE tick" reference:
```
- The PRIORITISE tick has no memory of previous cycles
```
Change to:
```
- The prioritise action has no memory of previous cycles
```

**Line 67** — stale "PRIORITISE tick" reference:
```
**What the agent recommends.** Direct input to the PRIORITISE tick. These are opinions about what should be worked on next and why.
```
Change to:
```
**What the agent recommends.** Direct input to the prioritise action. These are opinions about what should be worked on next and why.
```

**Update `last-modified-by`** in frontmatter to `elf`.

### File 2: `wiki/pages/verification.md`

**Line 42** — stale action types in TDD section:
```
- **Implementers** (`implement-spec`, `implement-plan`) cannot write test files (`src/__tests__/` is forbidden)
```
The current permission model in `src/verify/permissions.ts` uses `execute-work-item` with role "executor", which CAN write to `src/__tests__/`. The TDD enforcement described here no longer matches the code. Update to:
```
- **Executors** (`execute-work-item`) can write both source and test files — the executor role is broadly permissioned to support varied skill types
```

**Line 43** — stale action type:
```
- **Test writers** (`write-tests`) cannot write non-test source files
```
There is no `write-tests` action type. The current system handles test writing through `execute-work-item` with a test-coverage skill. Remove or update this line.

**Line 44** — stale action type:
```
- **Test fixers** (`fix-tests`) can write both source and tests (fixing requires both)
```
This one is still correct — `fix-tests` exists in the current code with role "test-fixer" and `canWrite: ["src/"]`.

**Line 46** — stale reference:
```
In practice, the current `implement-spec` prompt instructs the elf to "write failing tests first, then implement" within a single session, but the permission model prevents implementers from modifying existing test files. The `write-tests` action (for untested code) produces test-only changes.
```
This entire paragraph describes the old model. Replace with something like:
```
In practice, the `execute-work-item` action handles all implementation, testing, and documentation work. The executor role is broadly permissioned because the skill prompt (loaded from `.shoe-makers/skills/`) determines the scope of work. Permission boundaries in the table above apply to work items via their skill type.
```

### File 3: `wiki/pages/functionality.md`

**Line 43** — stale "PRIORITISE tick":
```
Suggestions live in the shift log or as findings tagged with a recommendation. The PRIORITISE tick reads them alongside the assessment data.
```
Change to:
```
Suggestions live in the shift log or as findings tagged with a recommendation. The prioritise action reads them alongside the assessment data.
```

## Current action types (from `src/types.ts` and `src/verify/permissions.ts`)

The current `ActionType` union: `fix-tests`, `fix-critique`, `critique`, `review`, `inbox`, `execute-work-item`, `dead-code`, `prioritise`, `innovate`, `evaluate-insight`, `explore`.

## Patterns to follow

- Previous doc-sync commits (e.g. `8c6c479`, `992e926`) changed specific lines in wiki pages
- Keep changes minimal — only fix the stale references, don't restructure
- Update `last-modified-by` in frontmatter to `elf`

## Tests

No new tests needed — this is a wiki-only change. Run `bun test` to confirm nothing breaks.

## What NOT to change

- Do NOT modify `.shoe-makers/invariants.md`
- Do NOT modify any code in `src/`
- Do NOT change the structure or layout of the wiki pages — only update the specific stale references
- Do NOT rewrite sections that are still accurate

## Decision Rationale

Candidate 1 (doc-sync for stale action types) was chosen because:
1. The stale references in verification.md actively describe a permission model that doesn't match the code — this could mislead elves about what they're allowed to do
2. It's a mechanical fix with clear before/after
3. Candidates 2 and 4 (test coverage) are valuable but lower urgency since the prompt system is working correctly
4. Candidate 3 (PRIORITISE tick references) is folded into this work item since it touches the same files
5. Candidate 5 (observability fix) is low-impact and the explore path rarely triggers Wikipedia fetch
