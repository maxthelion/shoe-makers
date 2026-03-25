# Candidates

## 1. Add claim evidence for 2.6.1 innovate observability invariants
**Type**: implement
**Impact**: high
**Reasoning**: The 5 specified-only invariants are all from section 2.6.1 (innovate observability). The code implementing them was just added (setup.ts logs the article, the prompt requires it), but `.shoe-makers/claim-evidence.yaml` has no entries for these claims. Without evidence rules, the invariant checker reports them as "specified-only" even though the code exists. This blocks the system from reaching innovation tier (tier 3). Add evidence entries mapping each 2.6.1 claim to the relevant source patterns (`appendToShiftLog`, `article.title`, `Wikipedia article fetched`) and test patterns. Files: `.shoe-makers/claim-evidence.yaml`, potentially `src/__tests__/setup.test.ts` or `src/__tests__/prompts.test.ts` for test evidence.

## 2. Update README tree diagram to include insights and innovation nodes
**Type**: doc-sync
**Impact**: medium
**Reasoning**: The README tree diagram (lines 17-27) shows the old 9-node tree without `[insights exist?] → Evaluate insight`, `[innovation tier?] → Innovate`, or the correct explore/innovate split. The actual tree in `src/tree/default-tree.ts` has 11 nodes. Invariant 3.5 states "The README reflects current capabilities as described by the invariants — not aspirational, not stale." This is a direct spec violation visible to users. File: `README.md`.

## 3. Add tests for innovate observability shift log entries
**Type**: test-coverage
**Impact**: medium
**Reasoning**: The setup.ts code now logs Wikipedia article titles to the shift log (lines 91-96), but there are no tests verifying this behaviour. The 2.6.1 invariant specifically says "The setup script logs which Wikipedia article was fetched (title) to the shift log, or logs that the fetch failed." Adding test evidence would also satisfy candidate #1's test evidence requirements. File: `src/__tests__/setup.test.ts`.

## 4. Complete innovate observability — shift log entry after insight written
**Type**: implement
**Impact**: medium
**Reasoning**: Invariant 2.6.1 says "The shift log entry for an innovate tick should include: the Wikipedia article title, whether an insight was written, and the insight filename." Currently, setup.ts logs the article title, but there's no mechanism for the elf to log whether an insight was written or its filename back to the shift log after the innovate action completes. This may need a post-action hook or instructions in the prompt for the elf to append to the shift log. Files: `src/prompts/three-phase.ts` (add instruction to log insight filename), potentially `src/setup.ts`.

## 5. Fix README three-phase orchestration description
**Type**: doc-sync
**Impact**: low
**Reasoning**: The README three-phase description (lines 36-40) mentions Explore, Prioritise, Execute but doesn't mention Innovate or Evaluate-insight as distinct phases. These were added in the behaviour tree and wiki spec but the README still shows the old 3-phase model. The description at line 26 mentions "random Wikipedia article" for explore but doesn't explain that innovate is a separate dedicated action. File: `README.md`.
