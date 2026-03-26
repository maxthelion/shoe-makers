import { OFF_LIMITS } from "./helpers";

export function buildReviewPrompt(): string {
  return `# Review Uncommitted Work

There are uncommitted changes on the branch. Review them before committing.

Run \`git diff\` to see the changes. Check against these criteria:
1. Does the code correctly implement what was asked?
2. Are there tests for the changes, and do they verify actual behaviour?
3. Does the change match the wiki spec?

If the changes are good, commit them with a descriptive message. If not, fix the issues first.${OFF_LIMITS}`;
}
