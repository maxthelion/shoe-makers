---
title: Structured Skills
category: spec
tags: [skills, templates, deterministic, format, output]
summary: Skills as semi-deterministic templates — setup fills in context, the skill defines output format, the elf provides judgement only.
last-modified-by: user
---

## The Problem

Elves waste ticks on format compliance. They write "RESOLVED" when the regex expects "Resolved." They forget required sections in insight files. They format candidates differently each time. These aren't judgement failures — they're template failures. The elf shouldn't be deciding what format to use; it should be told.

## The Pattern: Semi-Deterministic Skills

Every elf task has two parts:

1. **Mechanical**: what context to read, what format to output, what validation the output must pass
2. **Intelligent**: the actual assessment, decision, or creative work

Skills should handle the mechanical part completely. The setup script gathers context and slots it into the skill template. The elf receives a prompt where all the structure is pre-filled and it only needs to provide the intelligent parts.

### Example: write-critique

**Before** (current): The elf gets a prompt that says "review these changes and write a critique." It has to figure out the file format, the status line format, where to put the file, and what sections to include — alongside actually reviewing the code.

**After** (structured skill): Setup gathers the diff, the previous elf's action, the changed files. The skill template produces a prompt like:

```
Review this diff: [diff]
The previous elf was told: [last-action summary]

Write your critique to .shoe-makers/findings/critique-2026-03-25-003.md

Use this exact format:
---
# Critique — [your title]

## Changes Reviewed
[list the commits]

## Assessment
[YOUR JUDGEMENT HERE — is the work correct? Does it match the spec?]

## Issues Found
[YOUR JUDGEMENT HERE — list issues, or "None"]

## Status

Resolved.
---

The Status section must be exactly "Resolved." on its own line if no blocking issues.
If blocking issues exist, omit the Status section entirely.
```

The elf fills in the assessment and issues. Everything else is deterministic.

## Skills to Structure

### Reactive zone skills (output format is critical)

**write-critique** — adversarial review of previous elf's work
- Setup provides: diff, last-action.md summary, changed file list, commit range
- Template defines: filename (auto-numbered), sections, status format regex
- Elf provides: assessment, issues found, severity

**resolve-critique** — fixing issues flagged by a reviewer
- Setup provides: the critique file content, the specific issues
- Template defines: how to mark resolution, commit message format
- Elf provides: the actual fix

### Three-phase skills (context narrowing is critical)

**write-candidates** — explore phase output
- Setup provides: invariant counts, health scores, findings, tier classification
- Template defines: minimum 3 candidates, required fields (type, impact, reasoning), file path
- Elf provides: the actual candidates with reasoning

**write-work-item** — prioritise phase output
- Setup provides: candidates.md content, relevant wiki/code context
- Template defines: required sections (title, skill-type, wiki text, instructions, tests, off-limits, decision rationale), file path
- Elf provides: which candidate to pick, detailed implementation instructions

**write-insight** — innovate phase output
- Setup provides: wiki summary, Wikipedia article
- Template defines: required sections (Lens with article title, Connection, Proposal, Why), file path (auto-numbered), the article MUST be referenced
- Elf provides: the creative connection

**evaluate-insight** — evaluate-insight phase output
- Setup provides: insight file content
- Template defines: required sections (evaluation, build-on-it, decision), decision options (promote/rework/dismiss), output format for each option
- Elf provides: the evaluation and decision

### Housekeeping skills (fully deterministic)

**archive-findings** — move resolved findings to archive
- Could be fully deterministic — no LLM judgement needed
- Setup detects resolved findings and moves them

**update-shift-log** — append to the shift log
- Format is fixed, content comes from setup

## How Setup Uses Skills

1. Tree evaluates, picks an action (e.g. `critique`)
2. Setup loads the skill template for that action
3. Setup gathers the context the template requires (diff, last-action, etc.)
4. Setup interpolates context into the template, producing a complete prompt
5. The prompt includes the exact output format with validation patterns
6. The elf reads the prompt and fills in only the judgement parts

The skill registry already loads markdown files from `.shoe-makers/skills/`. The change is that skill templates become more structured — they include output format specifications that setup can use to build deterministic prompts.

## Validation

Each skill template can include a `## Validation` section with patterns that the output must match. The adversarial reviewer checks these. For example:

```yaml
validation:
  - pattern: "^## Status\\s*\\n\\s*Resolved\\.?\\s*$"
    description: "Status line must be exactly 'Resolved.' on its own line"
  - required-sections: ["Assessment", "Issues Found", "Status"]
```

This turns format compliance from "the elf has to remember" into "the system enforces."

See also: [[skills]], [[behaviour-tree]], [[verification]]
