# Shoe-Makers Protocol

This file contains your instructions. Follow them.

During bootstrap, this file acts as a human-readable behaviour tree. Once the real
behaviour tree is running, this file should be replaced with instructions to invoke
it. **Building the system that replaces these instructions is part of your job.**

## Your working pattern

1. **FIRST**: Run `git fetch origin` then check if today's branch exists: `git branch -r | grep shoemakers/YYYY-MM-DD`. If it exists, check it out with `git checkout -b shoemakers/YYYY-MM-DD origin/shoemakers/YYYY-MM-DD` (or `git checkout shoemakers/YYYY-MM-DD && git pull` if already local). If it doesn't exist, create it from main. **You must be on the shoemakers branch before doing anything else.**

### INBOX
2. Read `.shoe-makers/inbox/`. If there are any files, these are messages from the human. Read them, act on them (they take priority over other work), then delete them once addressed. Note what you did in the shift log.

### ASSESS
3. Read `.shoe-makers/findings/` and the latest shift log in `.shoe-makers/log/` — previous elves may have left important context.
3. Read every page in `wiki/pages/` — this is the specification.
4. Read the code in `src/` — this is what's built so far.
5. Note: what's specified but not implemented? What's implemented but not tested? What did previous elves flag?

### PRIORITISE
6. Pick ONE thing to work on. Consider:
   - What's most foundational? (things that unblock other work come first)
   - What did previous elves suggest?
   - Balance: don't just write features — tests, docs, and fixes matter too
   - When in doubt, build the thing that moves the system closer to running its own behaviour tree

### WORK
7. Build it. Write tests. Run `bun test` and make sure everything passes.
8. Commit to the branch with a clear message explaining what you built and why.

### VERIFY
9. After committing, review your own work: does it match the wiki spec? Do all tests pass? Did you introduce any inconsistencies?
10. If you spot issues, fix them before moving on.

### REPEAT
11. If there's time, go back to step 5 and pick the next thing.

## Logging — this is not optional

After each piece of work (or attempted work), you MUST:

- Append to `.shoe-makers/log/YYYY-MM-DD.md` with: timestamp, what you attempted, what happened, what you committed (or why you didn't)
- If you discovered something surprising, blocking, or useful for future elves, create a finding in `.shoe-makers/findings/` (short markdown file explaining what you found and why it matters)
- If you have opinions about what should be worked on next, note them in the shift log

An elf that does good work but leaves no trail is less valuable than one that does modest work and documents what it found.

## Self-improvement

As you work, notice friction. If something would have made your job easier, **add it**:

- A script you wished existed → add it to package.json
- A skill prompt that would help future elves → add it to `.shoe-makers/skills/`
- An instruction in this protocol that's unclear or wrong → fix it
- A wiki page that's missing or out of date → update it
- A finding that would save future elves time → write it

You are not just building features — you are improving the system that builds features. Every elf should leave the workshop in better shape than they found it.

## Rules

- Work on the shoemakers branch, never commit to main
- Every change must have tests. Run `bun test` before committing.
- If tests fail, fix them before moving on
- Read the wiki carefully — it describes the intended design. Follow it.
- If the wiki is unclear or contradictory, make a judgement call and write a finding about it
- Small, correct changes are better than large, broken ones
- If you update the implementation in a way that changes the design, update the relevant wiki page too
- Keep the README.md up to date — it should reflect what the project can actually do right now, not just the vision. If you've added a new command, feature, or changed how something works, update the README.
- Maintain a CHANGELOG.md with user-facing changes. Use Keep a Changelog format (Added/Changed/Fixed/Removed). Every commit that changes behaviour visible to a user should have a changelog entry.

## Self-replacement

This protocol file is a bootstrap. Once the behaviour tree evaluator, world state reader, scheduler, and skill invocation are all working, **replace these instructions** with something like:

```
Run `bun run tick` to execute one tick of the behaviour tree.
If it fails, read the error, fix it, and try again.
Log the result to .shoe-makers/log/.
```

The goal is to make this prose unnecessary by building the code that does the same thing.
