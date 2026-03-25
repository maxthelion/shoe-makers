# Doc-sync README with schedule and observability features

skill-type: doc-sync

## What to build

Update `README.md` to document three implemented features that are currently undocumented or underdocumented:

### 1. Working hours / schedule

The README shows the `schedule.md` format in the config section but doesn't explain what it does. Add a brief note after the schedule example explaining that setup exits immediately outside these hours, so the elves only work during the configured window.

### 2. Shift summary dashboard

The shift log system produces analytics that aren't mentioned in README:
- Action categorisation (fix, feature, test, docs, health, review)
- Balance scoring across categories
- Process pattern tracking (reactive ratio, review loops, innovation cycles)
- Tree trace analysis (reactive vs. routine vs. explore)

Add a brief mention in the "Branches and shifts" section.

### 3. Creative insight pipeline

The README mentions innovation tier and Wikipedia lens but doesn't explain the full pipeline: innovate → write insight → evaluate-insight (generous disposition) → promote/rework/dismiss. Add a sentence or two in the existing innovation paragraph.

## Patterns to follow

Keep the README concise — this project values brevity. Don't add new sections, expand existing ones with 1-2 sentences each.

## What NOT to change

- Do not restructure the README
- Do not change the wiki pages
- Do not modify source code

## Decision Rationale

Candidates #1 and #3 were already addressed (review-loop-breaker fix exists in code, permission-setup tests already exist). Candidate #2 was just completed. Candidate #4 is the next most actionable — the README is good but has specific gaps for implemented features.
