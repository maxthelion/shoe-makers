# Candidates

## 1. Add claim-evidence entries for archiveResolvedFindings and countInsights
**Type**: test
**Impact**: medium
**Reasoning**: Two new features were implemented this shift (auto-archive in `src/skills/assess.ts` and insight counting in `src/state/world.ts`) but neither has entries in `.shoe-makers/claim-evidence.yaml`. The invariants checker currently shows 0 unspecified, but that's because these features don't have corresponding spec claims yet. Adding evidence entries proactively keeps the evidence pipeline clean and documents what was built. Skill type: `test`.

## 2. Reduce prompts.ts line count by extracting the "After completing" footer
**Type**: octoclean-fix
**Impact**: low
**Reasoning**: `src/prompts.ts` (health 93) is the worst file. The `formatAction()` function in `src/setup.ts:216-248` appends "After completing/exploring" footers. But the actual prompt builders in `prompts.ts` don't know about this — the footer is added externally. This separation is actually good architecture. The health score of 93 is likely driven by the file's 362 lines of template strings rather than structural issues. Any further extraction would hurt readability without meaningful health improvement. **Recommend skipping this** — prompts.ts is fine as-is. Skill type: `octoclean-fix`.

## 3. Add `bun run assess` convenience script to package.json
**Type**: improve
**Impact**: low
**Reasoning**: `package.json` has scripts for `setup`, `tick`, `wiki`, and `init` but no standalone `assess` script. Running the assessment independently (without the full setup flow) would be useful for debugging and development. A simple `"assess": "bun run src/assess-cli.ts"` script would let developers check codebase health without triggering the full behaviour tree. Skill type: `implement`.
