# Add tree trace to tick result for shift log visibility

skill-type: implement

## What to build

Update `src/scheduler/tick.ts` to use `evaluateWithTrace` instead of `evaluate`, and include the trace in `TickResult`. Then update `formatTickLog` in `src/log/shift-log.ts` to include the trace in log entries, so the morning reviewer can see why each tick chose its action.

## What to change

### 1. Update `src/scheduler/tick.ts`

Change the import from `evaluate` to `evaluateWithTrace` and `formatTrace` from `../tree/evaluate`.

Add `trace` field to `TickResult`:
```typescript
export interface TickResult {
  timestamp: string;
  branch: string;
  skill: string | null;
  action: ActionType | null;
  trace: TraceEntry[];  // NEW
}
```

Import `TraceEntry` from `../tree/evaluate`.

Update the `tick()` function to use `evaluateWithTrace` and include trace in result.

### 2. Update `src/log/shift-log.ts`

Add an optional `trace` parameter to `formatTickLog`:
```typescript
export function formatTickLog(opts: {
  branch: string;
  tickType: string | null;
  skill: string | null;
  result: string | null;
  error: string | null;
  suggestions?: string[];
  trace?: string;  // NEW - pre-formatted trace string
}): string {
```

If `opts.trace` is provided, include it after the Decision line:
```typescript
if (opts.trace) {
  lines.push(`- **Tree trace**:\n${opts.trace}`);
}
```

### 3. Update `src/scheduler/shift.ts`

In `formatEntry()`, pass the trace to `formatTickLog`:
```typescript
return formatTickLog({
  ...existing fields...,
  trace: formatTrace(result.trace),  // NEW
});
```

Import `formatTrace` from `../tree/evaluate`.

### 4. Write tests

Add tests in `src/__tests__/evaluate.test.ts` or `src/__tests__/shift-log.test.ts`:
- `formatTickLog` includes trace when provided
- `formatTickLog` omits trace section when not provided
- `TickResult` includes trace field

## Patterns to follow

- The existing `formatTrace` function in `src/tree/evaluate.ts` already formats the trace — reuse it
- Keep `trace` optional in `formatTickLog` for backward compatibility

## What NOT to change

- Do NOT change `src/tree/evaluate.ts` (already has `evaluateWithTrace` and `formatTrace`)
- Do NOT change `src/setup.ts`
- Do NOT change `src/tree/default-tree.ts`
