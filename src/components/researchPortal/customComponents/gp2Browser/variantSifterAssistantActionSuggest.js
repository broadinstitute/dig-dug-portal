/**
 * Request-tab autocomplete for Variant Sifter Assist.
 * Pattern adapted from Canvas (`revealKgAssistantActionSuggest` / node token helpers).
 */

import { listVksAssistantActions } from "./variantSifterAssistantActionCatalog.js";

/** Verb-only suggestions (typed as the first or current word). */
export const VKS_ASSISTANT_ACTION_VERBS = [
    { verb: "zoom", label: "Zoom", keywords: ["zoom"] },
    { verb: "open", label: "Open", keywords: ["open", "show"] },
    { verb: "close", label: "Close", keywords: ["close", "hide"] },
    { verb: "export", label: "Export", keywords: ["export", "download"] },
    { verb: "import", label: "Import", keywords: ["import", "load"] },
    { verb: "reset", label: "Reset", keywords: ["reset", "clear", "new"] },
    { verb: "classify", label: "Classify", keywords: ["classify", "filter"] },
    { verb: "find", label: "Find", keywords: ["find", "show", "understudied", "correlated"] },
    { verb: "toggle", label: "Toggle", keywords: ["toggle"] },
];

export function getActiveToken(text, caretIndex) {
    const value = String(text || "");
    const caret = Math.max(0, Math.min(Number(caretIndex) || 0, value.length));
    let start = caret;
    while (start > 0 && /[\w.-]/.test(value[start - 1])) {
        start -= 1;
    }
    let end = caret;
    while (end < value.length && /[\w.-]/.test(value[end])) {
        end += 1;
    }
    return {
        token: value.slice(start, end),
        start,
        end,
    };
}

export function replaceActiveToken(text, start, end, replacement) {
    const value = String(text || "");
    const insert = String(replacement || "");
    const safeStart = Math.max(0, Math.min(start, value.length));
    const safeEnd = Math.max(safeStart, Math.min(end, value.length));
    return {
        text: value.slice(0, safeStart) + insert + value.slice(safeEnd),
        caret: safeStart + insert.length,
    };
}

export function assistantSuggestFullLabel(item) {
    return String(item?.fullLabel || item?.label || "").trim();
}

/** Show the full-name preview when labels are long or share a similar prefix. */
export function shouldShowAssistantSuggestPreview(suggestions = [], activeIndex = -1) {
    if (activeIndex < 0) {
        return false;
    }
    const labels = (suggestions || []).map(assistantSuggestFullLabel).filter(Boolean);
    if (!labels[activeIndex]) {
        return false;
    }
    if (labels[activeIndex].length > 36) {
        return true;
    }
    if (labels.length >= 2) {
        const prefixes = labels.map((label) => label.slice(0, 30));
        return new Set(prefixes).size < labels.length;
    }
    return false;
}

function scoreKeywordMatch(keywords = [], queryLower) {
    let best = -1;
    keywords.forEach((keyword) => {
        const key = String(keyword || "").toLowerCase();
        if (!key) {
            return;
        }
        if (key === queryLower) {
            best = Math.min(best === -1 ? 0 : best, 0);
        } else if (key.startsWith(queryLower)) {
            best = best === -1 ? 1 : Math.min(best, 1);
        } else if (key.includes(queryLower)) {
            best = best === -1 ? 2 : Math.min(best, 2);
        }
    });
    return best;
}

export function matchVksAssistantSuggestVerbs(token, { limit = 6, minLength = 2 } = {}) {
    const query = String(token || "").trim();
    if (query.length < minLength) {
        return [];
    }
    const queryLower = query.toLowerCase();
    return VKS_ASSISTANT_ACTION_VERBS.map((entry) => ({
        entry,
        score: scoreKeywordMatch([entry.verb, entry.label, ...(entry.keywords || [])], queryLower),
    }))
        .filter((row) => row.score >= 0)
        .sort((left, right) => {
            if (left.score !== right.score) {
                return left.score - right.score;
            }
            return String(left.entry.verb).localeCompare(String(right.entry.verb), undefined, {
                sensitivity: "base",
            });
        })
        .slice(0, limit)
        .map((row) => ({
            kind: "action",
            id: `verb:${row.entry.verb}`,
            label: row.entry.label,
            fullLabel: row.entry.label,
            insertText: row.entry.verb,
            hint: "Action",
        }));
}

export function matchVksAssistantSuggestActions(token, { limit = 8, minLength = 2 } = {}) {
    const query = String(token || "").trim();
    if (query.length < minLength) {
        return [];
    }
    const queryLower = query.toLowerCase();
    const rows = [];

    listVksAssistantActions().forEach((action) => {
        const phrases = [
            action.label,
            ...(action.examples || []),
            action.id.replace(/_/g, " "),
        ]
            .map((item) => String(item || "").trim())
            .filter(Boolean);

        phrases.forEach((phrase) => {
            const score = scoreKeywordMatch([phrase], queryLower);
            if (score < 0) {
                return;
            }
            rows.push({
                action,
                phrase,
                score,
            });
        });
    });

    const bestByAction = new Map();
    rows.forEach((row) => {
        const existing = bestByAction.get(row.action.id);
        if (
            !existing ||
            row.score < existing.score ||
            (row.score === existing.score && row.phrase.length < existing.phrase.length)
        ) {
            bestByAction.set(row.action.id, row);
        }
    });

    return [...bestByAction.values()]
        .sort((left, right) => {
            if (left.score !== right.score) {
                return left.score - right.score;
            }
            return String(left.action.label).localeCompare(String(right.action.label), undefined, {
                sensitivity: "base",
            });
        })
        .slice(0, limit)
        .map((row) => ({
            kind: "phrase",
            id: `action:${row.action.id}`,
            label: row.action.label,
            fullLabel: row.phrase,
            actionId: row.action.id,
            insertText: row.phrase,
            hint: "Action",
        }));
}

/**
 * Build autocomplete rows for the active draft token.
 * Prefer full action phrases; also offer short verbs when the token is early.
 */
export function buildVksAssistantAutocompleteSuggestions(
    { token } = {},
    { limit = 10, minLength = 2 } = {}
) {
    const query = String(token || "").trim();
    if (query.length < minLength) {
        return [];
    }

    const phrases = matchVksAssistantSuggestActions(query, {
        limit,
        minLength,
    });
    if (phrases.length >= limit) {
        return phrases.slice(0, limit);
    }

    const verbs = matchVksAssistantSuggestVerbs(query, {
        limit: Math.max(0, limit - phrases.length),
        minLength,
    }).filter(
        (verb) =>
            !phrases.some(
                (phrase) =>
                    String(phrase.label).toLowerCase() === String(verb.label).toLowerCase() ||
                    String(phrase.insertText).toLowerCase() === String(verb.insertText).toLowerCase()
            )
    );

    return [...phrases, ...verbs].slice(0, limit);
}
