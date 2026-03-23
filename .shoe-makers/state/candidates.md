# Candidates

## 1. Add invariant-suggestion instruction to explore prompt
**Type**: implement
**Impact**: medium
**Confidence**: high
**Risk**: low
**Reasoning**: Invariant "elves should suggest new invariants via findings" is specified-only. The explore prompt should tell elves: "If you find code without a matching invariant, write a finding suggesting a new invariant for `.shoe-makers/invariants.md`." This is a prompt-level instruction + evidence pattern. Resolves `spec.maintain-a-living-spec.when-new-code-exists-without-a-corresponding-invariant-elves`.

## 2. Add wiki-wins-over-code instruction to explore and execute prompts
**Type**: implement
**Impact**: medium
**Confidence**: high
**Risk**: low
**Reasoning**: Invariant "when wiki and code diverge, the NEWER change wins" is specified-only. The execute and explore prompts should instruct elves: "When wiki and code conflict, check which changed more recently. If the wiki is newer, change code to match — never revert the wiki." This is a prompt-level instruction + evidence pattern. Resolves `spec.maintain-a-living-spec.when-wiki-and-code-diverge-the-newer-change-wins`.

## 3. Push branch to remote
**Type**: doc-sync
**Impact**: medium
**Confidence**: high
**Risk**: low
**Reasoning**: The shoemakers/2026-03-23 branch has significant improvements: verify.ts refactored to pure function, Wikipedia integration wired, 456 tests, 14→2 specified-only invariants, health 99/100. Should push so changes are visible to the project owner.
