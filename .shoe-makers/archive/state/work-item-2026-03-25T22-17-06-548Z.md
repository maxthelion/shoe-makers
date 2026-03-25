# Add unit tests for format-action.ts

skill-type: test

## What to build

Write a dedicated test file `src/__tests__/format-action.test.ts` that directly tests the two exported functions from `src/scheduler/format-action.ts`:

### 1. `formatAction()`

This function has 3 branches to test:

**Branch 1 — Inbox messages** (lines 17-31):
When `skill === "inbox"` and `inboxMessages.length > 0`, returns a formatted inbox prompt with the message count and content.

```typescript
// Test: single inbox message
formatAction("inbox", state, [{ file: "request.md", content: "Please fix the bug" }])
// Should contain "1 message(s)" and the file name and content

// Test: multiple inbox messages
formatAction("inbox", state, [
  { file: "a.md", content: "First" },
  { file: "b.md", content: "Second" },
])
// Should contain "2 message(s)" and both messages separated by ---
```

**Branch 2 — Skill prompt** (lines 33-41):
When `skill` is a non-inbox action type, calls `generatePrompt()` and wraps with "After completing" footer.

```typescript
// Test: explore action
formatAction("explore", state, [])
// Should contain the explore prompt content and "After exploring" footer

// Test: other action (e.g. "fix-tests")
formatAction("fix-tests", state, [])
// Should contain "After completing" footer (not "After exploring")
```

**Branch 3 — No skill** (lines 44-47):
When `skill` is null, returns "Nothing to Do" message.

```typescript
formatAction(null, state, [])
// Should contain "Nothing to Do"
```

### 2. `readWikiOverview()`

**Test: reads and concatenates wiki files** (lines 50-68):
Creates a temp directory with mock wiki files, verifies they're concatenated with `---` separators and frontmatter stripped.

**Test: fallback when no wiki files exist**:
Points at a nonexistent directory, verifies the fallback message is returned.

**Test: skips missing files gracefully**:
Only create 1 of the 3 expected files, verify it returns just that content without error.

## Patterns to follow

Look at existing test files for patterns:
- `src/__tests__/run-skill.test.ts` — tests scheduler functions with mock state
- `src/__tests__/prompt-builders-reactive.test.ts` — tests prompt generation

Use `describe`/`test` from `bun:test`. Create mock `WorldState` objects — use this minimal shape:

```typescript
const mockState: WorldState = {
  branch: "shoemakers/2026-03-25",
  hasUncommittedChanges: false,
  inboxCount: 0,
  hasUnreviewedCommits: false,
  unresolvedCritiqueCount: 0,
  hasWorkItem: false,
  hasCandidates: false,
  workItemSkillType: null,
  hasPartialWork: false,
  insightCount: 0,
  blackboard: { assessment: null, currentTask: null },
  config: {
    branchPrefix: "shoemakers",
    tickInterval: 5,
    wikiDir: "wiki",
    assessmentStaleAfter: 30,
    maxTicksPerShift: 10,
    enabledSkills: null,
    insightFrequency: 0.3,
    maxInnovationCycles: 3,
  },
};
```

For `readWikiOverview`, use `mkdtemp` and `writeFile` to create temporary wiki files.

## What NOT to change

- Do not modify `src/scheduler/format-action.ts`
- Do not modify existing test files
- Do not add unnecessary abstractions or test helpers

## Decision Rationale

Candidate #1 (graduated review-loop-breaker) was initially top-ranked but inspection of `src/tree/default-tree.ts:39-41` shows the stuck-state bug is already fixed — `inReviewLoop()` returns false when candidates or work items exist. The graduated "high signal" behaviour (5+ loops → clear candidates) is speculative and not specified in the wiki.

Candidate #2 provides clear, immediate value: `format-action.ts` has 3 distinct code paths with no dedicated tests. Direct unit tests catch regressions without needing the full setup flow. Test coverage is the project's strength — this fills a gap.
