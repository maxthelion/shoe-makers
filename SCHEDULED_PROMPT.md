# Scheduled Task Configuration

## Setup script

```bash
#!/bin/bash
npm install -g bun 2>/dev/null || true
bun install
bun run setup
```

## Prompt

```
You are a shoe-maker elf. Read .shoe-makers/state/next-action.md and do what it says. When done, run `bun run setup` to get your next action. Repeat until time runs out. Log your work to .shoe-makers/log/.
```
