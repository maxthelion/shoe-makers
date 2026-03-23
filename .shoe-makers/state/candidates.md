# Candidates

## 1. Automated Permission Enforcement in Verification Gate
**Type**: implement
**Impact**: high
**Reasoning**: The wiki (`verification.md`) specifies that the system should check "did the elf stay within its permitted files?" but `isFileAllowed()` in `src/verify/permissions.ts` is defined but never called in any enforcement path. Adding an automated check that audits commits against the elf's declared role would close a significant trust gap. Currently, permission violations are only caught by manual adversarial review — automating this makes the system self-policing.

## 2. Insights Evaluation Pipeline with Structured Prompts
**Type**: implement
**Impact**: medium
**Reasoning**: The wiki (`creative-exploration.md`, lines 51-64) describes three decision modes for evaluating insights: Promote, Rework, and Dismiss. The `buildPrioritisePrompt` in `src/prompts/three-phase.ts` references insights but doesn't provide structured templates or examples for evaluation. Adding structured evaluation guidance to the prioritise prompt would unlock the creative tier's value and prevent good ideas from being lost.

## 3. Assessment Caching to Reduce Redundant Work
**Type**: health
**Impact**: medium
**Reasoning**: The config specifies `assessmentStaleAfter: 30` minutes but `setup.ts` runs a full assessment (reading all source/test files for evidence matching) on every tick regardless of cache freshness. The `readWorldState()` in `src/state/blackboard.ts` stores assessments but doesn't check staleness. Implementing proper cache-aware assessment would reduce per-tick compute and leave more time for productive work within each shift.
