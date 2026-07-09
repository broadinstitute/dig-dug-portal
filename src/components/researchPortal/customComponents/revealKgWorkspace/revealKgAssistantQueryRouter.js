/**
 * Assistant query pipeline (single Request tab, routing behind the curtain):
 *
 * 1. User query
 * 2. Command filter — if the whole request is one direct command, synthesize + auto-execute
 * 3. Otherwise LLM planner — plans from the full action catalog (commands + research)
 */

import { buildAssistantSessionContext } from "./revealKgAssistantContext.js";
import { planAssistantQuery } from "./revealKgAssistantLlm.js";
import {
    isAssistantCatalogHelpQuery,
    resolveAssistantCatalogHelpQuery,
} from "./revealKgAssistantCatalogHelp.js";
import {
    resolveDirectCommandQuery,
    synthesizeCommandsPlan,
} from "./revealKgAssistantCommandsPlan.js";

const COMMAND_SEGMENT_SPLIT =
    /\s+(?:and\s+then|then|and\s+also|also|and|after\s+that)\s+/i;

function querySegments(text) {
    const normalized = String(text || "").trim();
    if (!normalized) {
        return [];
    }
    return normalized
        .split(COMMAND_SEGMENT_SPLIT)
        .map((segment) => segment.trim())
        .filter(Boolean);
}

/**
 * True when the entire user query is a single direct command (no multi-step phrasing).
 * Multi-part requests (command + research, or multiple commands) return false → LLM.
 */
export function isDirectCommandQuery(userQuery, sessionContext) {
    const text = String(userQuery || "").trim();
    if (!text || querySegments(text).length !== 1) {
        return false;
    }
    return Boolean(synthesizeCommandsPlan(text, sessionContext));
}

/** @deprecated Use isDirectCommandQuery */
export function isPureCommandsQuery(userQuery, sessionContext) {
    return isDirectCommandQuery(userQuery, sessionContext);
}

/**
 * @returns {Promise<{ result: object, raw: object|null }>}
 */
export async function resolveAssistantQuery(userQuery, session, options = {}) {
    const sessionContext = buildAssistantSessionContext(session, options);

    if (isAssistantCatalogHelpQuery(userQuery)) {
        return resolveAssistantCatalogHelpQuery();
    }

    if (isDirectCommandQuery(userQuery, sessionContext)) {
        return resolveDirectCommandQuery(userQuery, session, options);
    }

    return planAssistantQuery(userQuery, session, options);
}
