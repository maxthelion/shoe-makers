# Structured skills — stop wasting ticks on format compliance

Read `wiki/pages/structured-skills.md` and invariants section 3.2.1.

The elves keep wasting ticks figuring out output format — writing "RESOLVED" when the regex wants "Resolved.", forgetting required sections, formatting candidates inconsistently. This is mechanical work that should be handled by setup + skill templates, not LLM judgement.

## What to build

Convert existing prompt generation into structured skill templates. The pattern:

1. Setup gathers context (diff, last-action, invariant counts, etc.)
2. Skill template defines exact output format, required sections, validation patterns
3. Setup interpolates context into template
4. Elf only fills in the intelligent parts (assessment, decisions, creative work)

### Priority order

Start with the skills that cause the most wasted ticks:

1. **write-critique** — include the exact filename, all required sections, the status format regex in the template itself so the elf can't get it wrong
2. **resolve-critique** — same: exact format for marking resolution
3. **write-insight** — must reference the Wikipedia article title, required sections
4. **write-candidates** — minimum count, required fields
5. **write-work-item** — required sections, skill-type metadata

### Housekeeping should be fully deterministic

Archive-findings and shift-log updates don't need LLM judgement at all. These should be handled by setup directly, not by the elf. If setup can detect resolved findings and archive them without invoking an LLM, do that.
