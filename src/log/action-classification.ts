/** Actions considered reactive (urgent/corrective) */
export const REACTIVE_ACTIONS = new Set(["fix-tests", "fix-critique", "critique", "continue-work", "review", "inbox"]);

/** Actions considered proactive (planned/creative) */
export const PROACTIVE_ACTIONS = new Set(["explore", "prioritise", "execute-work-item", "dead-code", "innovate", "evaluate-insight"]);
