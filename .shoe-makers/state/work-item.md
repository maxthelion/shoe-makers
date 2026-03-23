# Add claim-evidence entries for morning review dashboard

skill-type: implement

## Context

The observability spec (`wiki/pages/observability.md`, lines 87-95) says:

> When the human reviews the shoemakers branch, they should be able to:
> 1. Read the shift log to understand the narrative of the night's work

The existing claim `spec.observability.the-morning-review-should-be-selfcontained-shift-log-finding:` (claim-evidence.yaml line 1185) covers the self-contained requirement with evidence for `appendToShiftLog` and `formatTickLog`. But the new dashboard feature (`formatDashboard`, `prependShiftDashboard`) is not tracked.

Additionally, the observability spec (line 33) says:

> The shift runner (src/scheduler/shift.ts) also produces a ShiftSummary that categorises actions into improvement types

The dashboard makes this summary visible at the top of the log — a scannable blockquote instead of data buried at the bottom.

## What to do

Add claim-evidence entries to `.shoe-makers/claim-evidence.yaml` for the dashboard feature:

1. Add a new entry after the existing `spec.observability.the-morning-review-should-be-selfcontained-shift-log-finding:` entry:

```yaml
# Morning review dashboard — scannable summary at top of shift log
spec.observability.the-morning-review-should-be-selfcontained-shift-log-finding:
  # Update existing entry to include dashboard evidence
```

Actually, since the claim already exists, **update the existing entry** at line 1185 to add dashboard evidence:

```yaml
spec.observability.the-morning-review-should-be-selfcontained-shift-log-finding:
  source:
    - [appendToShiftLog]
    - [findings]
    - [formatTickLog]
    - [formatDashboard, prependShiftDashboard]
  test:
    - [appendToShiftLog, formatTickLog]
    - [findings]
    - [formatDashboard]
    - [prependShiftDashboard]
```

This adds `formatDashboard` and `prependShiftDashboard` as additional source and test evidence.

## Tests

No new tests needed — the evidence patterns point to existing code and tests:
- `formatDashboard` exists in `src/log/shift-log.ts` (source) and `src/__tests__/shift-log.test.ts` (test)
- `prependShiftDashboard` exists in both files

## What NOT to change

- Do not modify `src/` files — this is evidence-only
- Do not modify `.shoe-makers/invariants.md`
- Do not modify wiki pages
