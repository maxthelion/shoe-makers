# Add CHANGELOG version sections

skill-type: doc-sync

## What to change

Group the existing CHANGELOG entries into a versioned release (v0.1.0) with today's date, keeping only the configurable thresholds entry in [Unreleased]. This follows the Keep a Changelog format specified in invariant section 3.4.

## Relevant code

### CHANGELOG.md (current state)

Currently has only `## [Unreleased]` with ~40 entries covering the entire project history. The format follows Keep a Changelog but lacks version sections.

## Exact changes

1. Split `## [Unreleased]` into two sections:
   - `## [Unreleased]` containing only the configurable thresholds entry (the most recent addition)
   - `## [0.1.0] - 2026-03-25` containing all previous entries

2. The Unreleased section should have:
   ```markdown
   ## [Unreleased]

   ### Added
   - Configurable thresholds — `health-regression-threshold`, `review-loop-threshold`, `wikipedia-timeout`, `octoclean-timeout` in config.yaml with backward-compatible defaults
   ```

3. The v0.1.0 section should contain everything else (the original ### Added, ### Changed, ### Fixed sections with their entries).

## What NOT to change

- Do NOT modify any source code files
- Do NOT modify `.shoe-makers/invariants.md`
- Do NOT modify wiki pages
- Do NOT rewrite or edit existing changelog entries — just move them under the new version heading
- Do NOT remove or modify the configurable thresholds entry

## Tests to write

No tests needed — documentation-only change.

## Decision Rationale

Candidate #2 was chosen because:
- **Concrete improvement to human review workflow**: The CHANGELOG is read during morning review; version sections make it scannable.
- **Aligns with invariant 3.4**: "The CHANGELOG tracks user-facing changes in Keep a Changelog format" — versions are part of that format.
- **Test coverage candidate (#1) is lower priority**: format-action already has 15+ tests; permission-setup is 42 lines with straightforward logic. The directive says "prefer improvement over polishing."
- **Quick, low-risk**: Simple restructuring with no functional changes.
