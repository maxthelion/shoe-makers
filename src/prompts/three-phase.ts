/**
 * Re-exports for three-phase orchestration prompts.
 * Each prompt now lives in its own file to reduce merge conflicts.
 */
export { buildExplorePrompt } from "./explore";
export { buildPrioritisePrompt } from "./prioritise";
export { buildExecutePrompt, buildDeadCodePrompt } from "./execute";
export { buildInnovatePrompt } from "./innovate";
export { buildEvaluateInsightPrompt } from "./evaluate-insight";
