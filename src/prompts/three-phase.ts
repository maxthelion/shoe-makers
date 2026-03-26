// Re-export barrel — individual implementations live in their own files.
// This file exists so that existing imports from "./three-phase" continue to work.

export { buildExplorePrompt } from "./explore";
export { buildPrioritisePrompt } from "./prioritise";
export { buildExecutePrompt } from "./execute";
export { buildDeadCodePrompt } from "./dead-code";
export { buildInnovatePrompt } from "./innovate";
export { buildEvaluateInsightPrompt } from "./evaluate-insight";
