# Scheduled Task Configuration

## Setup script (bash, runs before Claude Code starts)

```bash
#!/bin/bash
BRANCH="shoemakers/$(date -u +%Y-%m-%d)"
git fetch origin
if git rev-parse --verify "origin/$BRANCH" >/dev/null 2>&1; then
  git checkout -b "$BRANCH" "origin/$BRANCH" 2>/dev/null || git checkout "$BRANCH" && git pull
else
  git checkout -b "$BRANCH"
fi
bun install
bun run setup
```

## Prompt

```
You are a shoe-maker elf. Read .shoe-makers/state/next-action.md and do what it says. When done, run `bun run setup` to get your next action. Repeat until time runs out. Log your work to .shoe-makers/log/.
```
