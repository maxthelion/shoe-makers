# Split registry.test.ts into parsing and loading test files

skill-type: octoclean-fix

## Context

`src/__tests__/registry.test.ts` is 309 lines and scored 95 by octoclean. It mixes pure parsing unit tests with filesystem-based loading integration tests. Splitting reduces file size and separates concerns.

## What to do

### 1. Create `src/__tests__/registry-parsing.test.ts`

Move these describe blocks (pure unit tests, no filesystem):
- `parseSkillFile` (lines 7-63) — frontmatter parsing and validation
- `parseOffLimits` (lines 180-222) — off-limits extraction
- `parseValidationPatterns` (lines 224-266) — validation pattern extraction
- `interpolateSkillContext` (lines 268-292) — context slot replacement
- `findSkillForType` (lines 294-309) — skill lookup by type

Imports needed:
```typescript
import { describe, test, expect } from "bun:test";
import { parseSkillFile, findSkillForType, interpolateSkillContext, type SkillDefinition } from "../skills/registry";
```

### 2. Create `src/__tests__/registry-loading.test.ts`

Move this describe block (uses temp dirs, filesystem):
- `loadSkills` (lines 65-178) — loading from directory, filtering by enabledSkills

Imports needed:
```typescript
import { describe, test, expect } from "bun:test";
import { loadSkills } from "../skills/registry";
import { mkdtemp, mkdir, writeFile, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
```

### 3. Delete `src/__tests__/registry.test.ts`

Only after both new files pass.

## Patterns to follow

- Copy test code exactly — do NOT modify test logic, assertions, or names
- Each new file imports only what it needs
- The `tmpDir` variable and temp dir setup stays only in `registry-loading.test.ts`
- Preserve describe block structure exactly

## Tests to run

```bash
bun test
```

All tests must pass. Total test count should remain the same (888).

## What NOT to change

- Do NOT modify any test logic, assertions, or test names
- Do NOT add new tests or remove existing tests
- Do NOT modify source files
- Do NOT touch `.shoe-makers/invariants.md`
- Do NOT modify `test-utils.ts`

## Decision Rationale

Chose candidate #1 (continue splitting worst-scoring test files) because it continues the successful pattern from the previous tick — the 3 files we split are no longer in the worst list. `registry.test.ts` at 309 lines and score 95 is the next natural target. The split is mechanical and low-risk. Other candidates (tests, doc-sync, assess.ts refactoring) are either test-heavy work the prompt discourages, or target files that are already well-structured.
