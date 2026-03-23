# Enrich explore and prioritise prompts with assessment details

skill-type: implement

## Context

The explore and prioritise prompts tell agents aggregate counts ("5 specified-only invariants") but never show the details. The `Assessment` type already contains:
- `topSpecGaps: InvariantSummary[]` — top specified-only items with `id`, `description`, `group`
- `topUntested: InvariantSummary[]` — top untested items
- `worstFiles: { path: string; score: number }[]` — lowest health files
- `findings: Finding[]` — with `id` and `content`
- `healthScore: number`

These are populated by `src/skills/assess.ts` and available via `state.blackboard.assessment`.

## What to change

### 1. In `src/prompts.ts`, explore prompt (lines 213-232)

**When tier is Hygiene/Implementation** (eHasGaps is true), add a "## Key gaps" section listing the top spec gaps and untested items from the assessment. Format:

```
## Key gaps

${topSpecGaps.slice(0, 5).map(g => `- **${g.description}** (${g.group})`).join('\n')}
```

Only add this section if `topSpecGaps` or `topUntested` have entries.

**When tier is Innovation**, add a "## Codebase snapshot" section:

```
## Codebase snapshot

- Health: ${healthScore}/100
- Worst files: ${worstFiles.slice(0, 3).map(f => `${f.path} (${f.score})`).join(', ')}
- Open findings: ${findings.length}
```

This gives Innovation-tier elves concrete starting points.

### 2. In `src/prompts.ts`, prioritise prompt (lines 151-193)

After the tier guidance paragraph, add top spec gaps if they exist:

```
${topSpecGaps.length > 0 ? `\nTop invariant gaps:\n${topSpecGaps.slice(0, 5).map(g => `- ${g.description}`).join('\n')}` : ''}
```

### 3. Access pattern

The data is at `state.blackboard.assessment?.invariants?.topSpecGaps` etc. Guard with optional chaining and provide empty arrays as fallbacks.

### 4. Tests to write

Add to `src/__tests__/prompts.test.ts`:

```typescript
test("explore Hygiene tier includes top spec gaps when available", () => {
  // Use makeStateWithGaps(3, 0) — freshAssessment has topSpecGaps with 1 entry
  // Check prompt contains the description from topSpecGaps[0]
});

test("explore Innovation tier includes health score", () => {
  // Use makeStateWithGaps(0, 0)
  // Check prompt contains healthScore value
});

test("prioritise includes top spec gaps when available", () => {
  // Use makeStateWithGaps(3, 0)
  // Check prompt contains description from topSpecGaps
});
```

## Patterns to follow

- Use `const assessment = state.blackboard.assessment;` and guard with `?.`
- Format lists with `map().join('\n')`
- Keep sections short — these are prompts, not reports
- Follow the existing template literal style in prompts.ts

## Do NOT change

- `src/types.ts` — Assessment type already has everything needed
- `src/skills/assess.ts` — data is already collected
- `.shoe-makers/invariants.md`
- Wiki pages
