# Candidates

## 1. Insights Evaluation Pipeline with Structured Prompts
**Type**: implement
**Impact**: high
**Reasoning**: The wiki (`creative-exploration.md`, lines 51-64) describes three decision modes for evaluating insights: Promote, Rework, and Dismiss. The `buildPrioritisePrompt` in `src/prompts/three-phase.ts` references insights but doesn't provide structured templates or example formats for evaluation decisions. The prioritise prompt mentions the concepts but doesn't give the elf a concrete format for recording decisions. Adding a structured template (e.g., a decision block with rationale) would make insight evaluation consistent and auditable, unlocking the creative tier's value.

## 2. Update Wiki verification.md to Document Permission Enforcement
**Type**: doc-sync
**Impact**: medium
**Reasoning**: We just implemented automated permission violation detection in `src/setup.ts` that checks `checkPermissionViolations()` against the previous elf's role. The wiki page `verification.md` describes the manual review process ("did the elf stay within its permitted files?") but doesn't mention that this is now partially automated. The spec should be updated to document that the critique prompt now includes pre-computed permission violations, keeping wiki and code in sync per the `wiki-as-spec.md` principle.

## 3. Reduce setup.ts Complexity (Health Score 95)
**Type**: octoclean-fix
**Impact**: medium
**Reasoning**: `src/setup.ts` has a health score of 95 — it's the third worst file in the codebase. The `detectPermissionViolations` function we just added increases its responsibility. The file handles branch setup, assessment, tree evaluation, prompt generation, permission detection, and log writing. Extracting `detectPermissionViolations` and `buildWorldState` into dedicated modules (`src/state/permissions.ts`, keeping `buildWorldState` in `src/state/world.ts`) would improve separation of concerns and bring setup.ts closer to being a thin orchestrator.
