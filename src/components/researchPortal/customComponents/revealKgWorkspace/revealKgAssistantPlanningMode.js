/** Canvas assistant planning mode (two-speed Assist UX). */

export const ASSISTANT_PLANNING_MODE_COMMANDS = "commands";
export const ASSISTANT_PLANNING_MODE_RESEARCH = "research";

export const ASSISTANT_PLANNING_MODES = [
    ASSISTANT_PLANNING_MODE_COMMANDS,
    ASSISTANT_PLANNING_MODE_RESEARCH,
];

export function normalizeAssistantPlanningMode(value) {
    const mode = String(value || "").trim().toLowerCase();
    return ASSISTANT_PLANNING_MODES.includes(mode)
        ? mode
        : ASSISTANT_PLANNING_MODE_RESEARCH;
}

export function isCommandsPlanningMode(mode) {
    return normalizeAssistantPlanningMode(mode) === ASSISTANT_PLANNING_MODE_COMMANDS;
}
