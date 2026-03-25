/**
 * Core housekeeping paths — files under these directories are modified by the
 * scheduler (archive moves, shift log entries, findings), not by elf agents.
 */
const CORE_HOUSEKEEPING_PATHS = [".shoe-makers/findings/", ".shoe-makers/log/", ".shoe-makers/archive/"];

/**
 * Paths used to filter false-positive permission violations.
 * Does NOT include `.shoe-makers/state/` because elves legitimately write
 * state files (candidates.md, work-item.md) that should be reviewed.
 */
export const SETUP_HOUSEKEEPING_PATHS = CORE_HOUSEKEEPING_PATHS;

/**
 * Extended housekeeping paths for auto-commit scope in setup.ts.
 * Includes `.shoe-makers/state/` because state changes made by setup
 * (assessment.json, next-action.md) are mechanical, not elf-authored.
 */
export const ALL_HOUSEKEEPING_PATHS = [...CORE_HOUSEKEEPING_PATHS, ".shoe-makers/state/"];
