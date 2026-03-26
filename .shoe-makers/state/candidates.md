# Candidates

## 1. Add tests for assess.ts (core assessment engine)
**Type**: test
**Impact**: high
**Reasoning**: `src/skills/assess.ts` (218 lines) is the heart of the assessment pipeline — it aggregates invariants, health scores, findings, plans, and git activity into the blackboard. It has zero test coverage despite being called every tick. Key functions to test: `runAssessment()` output shape, `buildSuggestions()` logic, `archiveResolvedFindings()` behaviour, and `findOpenPlans()` wiki parsing. Silent try/catch blocks throughout mean bugs could go undetected. This is the single highest-risk untested module.

## 2. Add tests for verify/permissions.ts and verify/detect-violations.ts
**Type**: test
**Impact**: high
**Reasoning**: `src/verify/permissions.ts` (137 lines) defines the role-based permission model that controls which files each elf action can modify. `src/verify/detect-violations.ts` (133 lines) detects permission violations in commits. Neither has any test coverage. These are security-critical — a bug here could let an elf modify files it shouldn't (e.g., invariants.md). Tests should cover: permission lookups for each action type, glob pattern matching for edge cases, violation detection against known-good and known-bad diffs.

## 3. Add tests for verify/invariants.ts (spec-code verification)
**Type**: test
**Impact**: high
**Reasoning**: `src/verify/invariants.ts` (216 lines) is the core invariant checking engine that compares spec claims against code evidence. It drives the explore/prioritise cycle by surfacing specified-only, untested, and unspecified invariants. Has zero tests despite complex logic: recursive directory walks, claim classification (lines 89-104), evidence pattern matching via string search (line 80+), and `findUnspecifiedDirs()` loose mapping (lines 117-143). Fragile evidence matching could misclassify invariants, leading elves to work on phantom gaps or miss real ones.

## 4. Add tests for shift-summary.ts (shift analysis)
**Type**: test
**Impact**: medium
**Reasoning**: `src/log/shift-summary.ts` (286 lines) is the most complex file in the log module. It computes process patterns (review loop detection, reactive ratio, innovation cycle count) that directly influence tree routing via the review-loop-breaker nodes. The heuristic-based review loop detection (lines 105-125) and reactive ratio calculation are untested — false positives could force unnecessary explore cycles, false negatives could let the system get stuck in review loops. Extract heuristics into pure functions and test them.

## 5. Deduplicate frontmatter parsing in creative/wikipedia.ts
**Type**: health
**Impact**: low
**Reasoning**: `src/creative/wikipedia.ts` (lines 71-82) duplicates the YAML frontmatter parsing logic already implemented in `src/utils/frontmatter.ts`. This is a minor code health issue — the duplicate could drift out of sync. Replace with an import of the shared utility. Simple, low-risk cleanup.
