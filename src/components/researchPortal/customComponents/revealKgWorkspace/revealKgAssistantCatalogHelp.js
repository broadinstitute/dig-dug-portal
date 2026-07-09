/** In-chat help for “what can I ask?” / command-list requests (no canvas actions). */

import { ASSISTANT_ACTION_CATALOG_SECTIONS } from "./revealKgAssistantActionCatalog.js";
import { validateAssistantClarification } from "./revealKgAssistantPlan.js";

const CATALOG_HELP_PATTERNS = [
    /\b(?:list|show|give|tell|provide)\b[\s\S]{0,48}\b(?:commands?|actions?)\b/i,
    /\bwhat\s+(?:commands?|actions?|can\s+I\s+(?:ask|do|use))\b/i,
    /\b(?:commands?|actions?)\s+(?:can\s+I|do\s+you|are\s+available|should\s+I)\b/i,
    /\b(?:available|supported)\s+(?:canvas\s+)?(?:commands?|actions?)\b/i,
    /\bhow\s+(?:do\s+I|to)\s+use\b[\s\S]{0,40}\b(?:assistant|commands?|actions?)\b/i,
    /\b(?:common|canvas)\s+commands?\b/i,
    /\bwhat\s+can\s+(?:I|you)\s+ask\b/i,
    /\bhelp\b[\s\S]{0,32}\b(?:commands?|actions?|assistant)\b/i,
];

export function isAssistantCatalogHelpQuery(userQuery = "") {
    const text = String(userQuery || "").trim();
    if (!text) {
        return false;
    }
    if (CATALOG_HELP_PATTERNS.some((pattern) => pattern.test(text))) {
        return true;
    }
    return /\bcommands?\s+I\s+can\s+use\b/i.test(text);
}

export function buildAssistantCatalogHelpMessage() {
    const lines = [
        "Open the Actions tab for full descriptions and example requests. Here is a quick map:",
        "",
    ];
    for (const section of ASSISTANT_ACTION_CATALOG_SECTIONS) {
        lines.push(`${section.section}`);
        for (const group of section.groups) {
            const labels = group.actions.map((action) => action.label).join(", ");
            lines.push(`  ${group.group}: ${labels}`);
        }
        lines.push("");
    }
    lines.push(
        "Type a request on this tab to run it. Simple one-part phrases often run immediately; exploratory requests are planned step by step."
    );
    return lines.join("\n").trim();
}

export function assistantCatalogHelpClarifyJson() {
    return {
        response_type: "clarify",
        message: buildAssistantCatalogHelpMessage(),
        issues: [],
        suggestions: [
            "Open the Actions tab to browse Commands and Research groups with examples.",
            "Try a direct phrase like “Open filter panel” or “Explain selected nodes”.",
        ],
    };
}

export function resolveAssistantCatalogHelpQuery() {
    return {
        result: validateAssistantClarification(assistantCatalogHelpClarifyJson()),
        raw: null,
    };
}

/** True when the planner mis-used explain_graph for a help/meta request. */
export function plannerJsonLooksLikeCatalogHelpMisroute(json, userQuery = "") {
    if (!isAssistantCatalogHelpQuery(userQuery)) {
        return false;
    }
    const steps = Array.isArray(json?.steps) ? json.steps : [];
    if (!steps.length) {
        return true;
    }
    return steps.every((step) => {
        const action = String(step?.action || step?.tool || "").trim();
        return action === "explain_graph";
    });
}
