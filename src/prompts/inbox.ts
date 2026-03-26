import type { WorldState } from "../types";
import { OFF_LIMITS } from "./helpers";

export function buildInboxPrompt(state: WorldState): string {
  return `# Inbox Messages

There are ${state.inboxCount} message(s) in \`.shoe-makers/inbox/\`. Read them, do what they ask, commit your work, then delete the message files.${OFF_LIMITS}`;
}
