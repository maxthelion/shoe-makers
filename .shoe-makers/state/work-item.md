skill-type: doc-sync

# Write finding for unspecified process-patterns self-monitoring loop

## Wiki Spec

`wiki/pages/architecture.md` and invariants section 2.2 describe reactive conditions and the tree structure. Section 3.4 ("Observability") specifies that the shift log tells a narrative. None of these mention the self-monitoring loop that extracts machine-readable patterns from the shift log to alter tree routing and explore prompts.

## Current Code

Three interconnected features form an undocumented self-monitoring loop:

1. **Shift log parsing** (`src/log/shift-log-parser.ts`): `computeProcessPatterns()` parses the shift log to compute `reviewLoopCount`, `reactiveRatio`, and `innovationCycleCount`.

2. **Review-loop-breaker nodes** (`src/tree/default-tree.ts` lines 31-34): Two tree nodes check if `reviewLoopCount >= 3` — if so, they force `explore` or `prioritise` to break the review cycle. These are architectural nodes with no spec coverage.

3. **Process temperature guidance** (`src/prompts/explore.ts` lines 16-37): The explore prompt injects guidance based on `reactiveRatio` — high ratio suggests looking at proactive work, low ratio suggests checking for reactive needs.

4. **Innovation cycle cap** (`src/tree/default-tree.ts` lines 73-77): `innovationCycleCount` caps how many innovate cycles run per shift (default 3, configurable via `max-innovation-cycles`).

## What to Build

Write a finding to `.shoe-makers/findings/unspecified-process-patterns.md` documenting these unspecified features for human review. The finding should:

1. List each unspecified feature with file paths and line numbers
2. Explain why it matters (these alter tree routing and prompt content)
3. Recommend the human add invariants covering this behaviour
4. Mark as "Open — requires human action"

## Patterns to Follow

Follow the format of `.shoe-makers/findings/stale-invariants-skills-list.md` — observation, why it matters, recommendation, status.

## Tests to Write

None — this is a finding, not a code change.

## What NOT to Change

- Do NOT modify any source code
- Do NOT modify `.shoe-makers/invariants.md`
- Do NOT modify wiki pages
- Only write the finding file

## Decision Rationale

Candidates 1 and 2 are already completed (world.test.ts and setup.test.ts splits). Candidate 3 documents significant architectural behaviour that is invisible to the spec — the self-monitoring loop that alters tree routing. This is more impactful than candidate 5 (prompt-builders health, score already 93) because it helps the human understand and maintain undocumented behaviour.
