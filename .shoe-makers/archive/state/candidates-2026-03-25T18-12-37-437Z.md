# Candidates

## 1. Improve health of worst-scoring test files
**Type**: octoclean-fix
**Impact**: medium
**Reasoning**: Setup reports the three worst files are `src/__tests__/prompts-features.test.ts` (90), `src/__tests__/prompt-builders.test.ts` (90), and `src/__tests__/setup.test.ts` (93). These are the only files dragging the health score below 100. Both prompt test files are 400+ lines with repetitive test structures that could benefit from shared helpers and reduced duplication. The health score is 99/100 — improving these files would bring it to a perfect score.

## 2. Add tests for untested modules (blackboard, permission-setup, init-templates)
**Type**: test
**Impact**: medium
**Reasoning**: Several modules have no dedicated test coverage: `src/state/blackboard.ts` (JSON serialization of assessment state), `src/scheduler/permission-setup.ts` (detects previous elf's permission violations), `src/init-templates.ts`, `src/init-skill-templates-*.ts`, `src/run-init.ts`, and `src/task.ts`. The blackboard and permission-setup modules are runtime-critical — blackboard handles state persistence between ticks, and permission-setup feeds into the verification gate. Adding tests would prevent silent regressions. Wiki page `verification.md` specifies role-based permissions and verification gates; the permission-setup module implements this but has no test proving it works.

## 3. Replace empty catch blocks in world.ts with meaningful error handling
**Type**: health
**Impact**: low
**Reasoning**: `src/state/world.ts` contains 5+ empty catch blocks that silently swallow errors (e.g., when counting inbox files, findings, insights). While the graceful degradation to 0/false is correct behavior, the complete absence of logging means debugging is difficult when things go wrong. The `observability.md` wiki page specifies that the system should have "full observability through shift logs and findings" — silent error suppression works against this goal. A lightweight fix: log a debug-level message in each catch block so errors are traceable without changing behavior.

## 4. Sync README with current state (octoclean dependency, wiki server path)
**Type**: doc-sync
**Impact**: low
**Reasoning**: The README has two minor inaccuracies: (1) the `bun run wiki` command references a hardcoded local path in package.json (`/Users/maxwilliams/dev/octowiki/src/index.ts`) which won't work for other developers, and (2) the README mentions octoclean monitoring without noting it's an optional dependency that degrades gracefully when absent. The `wiki-as-spec.md` page says documentation should reflect current capabilities accurately. These are minor but affect onboarding.
