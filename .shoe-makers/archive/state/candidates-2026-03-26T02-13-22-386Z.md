# Candidates

## 1. [Implement structured innovate skill — pre-filled insight output template]
**Type**: implement
**Impact**: high
**Reasoning**: Per `wiki/pages/structured-skills.md` lines 84-87, the `write-insight` (innovate) skill should enforce required sections (Lens with article title, Connection, Proposal, Why) with pre-filled placeholders. Currently `src/prompts/innovate.ts` describes sections in prose but doesn't use the structured `[YOUR CONTENT HERE]` placeholder pattern. Following the structured explore and prioritise patterns, pre-fill the insight template sections so the elf only provides the creative content. This directly closes invariant gaps for structured-skills claims: "the skill template defines the exact output format" and "the elf receives a prompt where all structure is pre-filled."

## 2. [Implement structured evaluate-insight skill — pre-filled evaluation output template]
**Type**: implement
**Impact**: high
**Reasoning**: Per `wiki/pages/structured-skills.md` lines 89-92, the `evaluate-insight` skill should enforce required sections (evaluation, build-on-it, decision) with specific decision options (promote/rework/dismiss) and output format for each option. Currently `src/prompts/evaluate-insight.ts` describes the options in prose but doesn't use pre-filled template placeholders. This is the last of the three-phase skills to structure. Same invariant gaps as candidate 1.

## 3. [Add commit-or-revert verification evidence — close top specified-only gap]
**Type**: implement
**Impact**: medium
**Reasoning**: The top invariant gap is `verification.commit-or-revert` from the architecture group. The claim evidence in `.shoe-makers/claim-evidence/06-verification.yaml` defines patterns (`"commit"`, `"revert"`) but the verification pipeline can't find matching source/test evidence. This likely needs a verification-related source file or test that explicitly handles the commit-or-revert decision. Closing this gap removes a persistent top-gap from setup output and reduces specified-only count from 20.
