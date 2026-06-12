/** Verb-only autocomplete for canvas assistant actions (nouns typed separately). */

import { matchAssistantSuggestNodes } from "./revealKgAssistantNodeSuggest.js";

/**
 * @typedef {Object} AssistantActionVerb
 * @property {string} verb - Text inserted into the request (lowercase).
 * @property {string} label - Dropdown label.
 * @property {string} [actionId] - Planner action id (hint only).
 * @property {string[]} keywords - Prefix/substring match keys (lowercase).
 */

/** @type {AssistantActionVerb[]} */
export const ASSISTANT_ACTION_VERBS = [
    { verb: "explain", label: "Explain", actionId: "explain_graph", keywords: ["explain"] },
    { verb: "expand", label: "Expand", actionId: "expand_graph", keywords: ["expand"] },
    { verb: "filter", label: "Filter", actionId: "filter_graph", keywords: ["filter"] },
    { verb: "select", label: "Select", actionId: "select_nodes", keywords: ["select"] },
    {
        verb: "unselect",
        label: "Unselect",
        actionId: "unselect_nodes",
        keywords: ["unselect", "deselect"],
    },
    { verb: "add", label: "Add", actionId: "add_node", keywords: ["add"] },
    { verb: "remove", label: "Remove", actionId: "remove_node", keywords: ["remove", "delete"] },
    { verb: "inspect", label: "Inspect", actionId: "inspect", keywords: ["inspect"] },
    { verb: "zoom", label: "Zoom", actionId: "focus_graph_view", keywords: ["zoom", "focus"] },
    { verb: "fit", label: "Fit", actionId: "focus_graph_view", keywords: ["fit"] },
    { verb: "show", label: "Show", actionId: "set_jumping_edges_visible", keywords: ["show"] },
    { verb: "hide", label: "Hide", actionId: "set_jumping_edges_visible", keywords: ["hide"] },
    { verb: "build", label: "Build", actionId: "build_hypotheses", keywords: ["build"] },
    { verb: "find", label: "Find", actionId: "find_datasets", keywords: ["find"] },
    { verb: "save", label: "Save", actionId: "save_graph", keywords: ["save"] },
    { verb: "export", label: "Export", actionId: "export_graph", keywords: ["export"] },
    { verb: "import", label: "Import", actionId: "import_graph", keywords: ["import"] },
    { verb: "download", label: "Download", actionId: "download_snapshot", keywords: ["download"] },
    { verb: "open", label: "Open", actionId: "open_my_library", keywords: ["open"] },
    { verb: "new", label: "New", actionId: "new_graph", keywords: ["new"] },
];

/**
 * Multi-word view targets (typed after show/hide or as a shorthand phrase).
 * @type {Array<{ phrase: string, label: string, actionId: string, keywords: string[] }>}
 */
export const ASSISTANT_ACTION_PHRASES = [
    {
        phrase: "jumping edges",
        label: "Jumping edges",
        actionId: "set_jumping_edges_visible",
        keywords: ["jumping edges", "jumping", "jump", "hopping edges", "hopping"],
    },
    {
        phrase: "contextual edges",
        label: "Contextual edges",
        actionId: "set_contextual_edges_visible",
        keywords: ["contextual edges", "contextual", "context", "dashed edges", "dashed"],
    },
];

/**
 * Entity-type nouns (typed after verbs like select/add/filter).
 * @type {Array<{ phrase: string, label: string, nodeType: string, keywords: string[] }>}
 */
export const ASSISTANT_ENTITY_TYPES = [
    {
        phrase: "gene",
        label: "Gene",
        nodeType: "gene",
        keywords: ["gene", "genes"],
    },
    {
        phrase: "gene set",
        label: "Gene set",
        nodeType: "gene_set",
        keywords: ["gene set", "geneset"],
    },
    {
        phrase: "mechanism",
        label: "Mechanism",
        nodeType: "factor",
        keywords: ["mechanism", "mechanisms", "mech", "factor", "factors"],
    },
    {
        phrase: "trait",
        label: "Trait",
        nodeType: "trait",
        keywords: ["trait", "traits"],
    },
];

/**
 * Common graph nouns (node, nodes, graph).
 * @type {Array<{ phrase: string, label: string, keywords: string[] }>}
 */
export const ASSISTANT_GRAPH_TERMS = [
    {
        phrase: "node",
        label: "Node",
        keywords: ["node"],
    },
    {
        phrase: "nodes",
        label: "Nodes",
        keywords: ["nodes"],
    },
    {
        phrase: "graph",
        label: "Graph",
        keywords: ["graph", "graphs"],
    },
];

const VERB_LOOKUP = new Set(ASSISTANT_ACTION_VERBS.map((entry) => entry.verb));
const VIEW_MODIFIER_VERBS = new Set(["show", "hide"]);

export function assistantActionVerbSet() {
    return VERB_LOOKUP;
}

function phraseMatchScore(entry, queryLower) {
    let best = -1;
    for (const keyword of entry.keywords) {
        const key = String(keyword || "").toLowerCase();
        if (!key) {
            continue;
        }
        if (key === queryLower) {
            best = Math.min(best === -1 ? 0 : best, 0);
        } else if (key.startsWith(queryLower)) {
            best = best === -1 ? 1 : Math.min(best, 1);
        } else if (key.includes(queryLower)) {
            best = best === -1 ? 2 : Math.min(best, 2);
        }
    }
    const phraseLower = String(entry.phrase || "").toLowerCase();
    if (phraseLower === queryLower) {
        best = Math.min(best === -1 ? 0 : best, 0);
    } else if (phraseLower.startsWith(queryLower)) {
        best = best === -1 ? 1 : Math.min(best, 1);
    }
    return best;
}

function verbMatchScore(entry, queryLower) {
    let best = -1;
    for (const keyword of entry.keywords) {
        const key = String(keyword || "").toLowerCase();
        if (!key) {
            continue;
        }
        if (key === queryLower) {
            best = Math.min(best === -1 ? 0 : best, 0);
        } else if (key.startsWith(queryLower)) {
            best = best === -1 ? 1 : Math.min(best, 1);
        } else if (key.includes(queryLower)) {
            best = best === -1 ? 2 : Math.min(best, 2);
        }
    }
    const verbLower = String(entry.verb || "").toLowerCase();
    if (verbLower === queryLower) {
        best = Math.min(best === -1 ? 0 : best, 0);
    } else if (verbLower.startsWith(queryLower)) {
        best = best === -1 ? 1 : Math.min(best, 1);
    }
    return best;
}

export function matchAssistantSuggestActions(token, { limit = 6, minLength = 2 } = {}) {
    const query = String(token || "").trim();
    if (query.length < minLength) {
        return [];
    }
    const queryLower = query.toLowerCase();
    return ASSISTANT_ACTION_VERBS.map((entry) => ({
        entry,
        score: verbMatchScore(entry, queryLower),
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
            id: `action:${row.entry.verb}`,
            verb: row.entry.verb,
            label: row.entry.label,
            actionId: row.entry.actionId,
            insertText: row.entry.verb,
            hint: "Action",
        }));
}

export function matchAssistantSuggestEntityTypes(token, { limit = 4, minLength = 2 } = {}) {
    const query = String(token || "").trim();
    if (query.length < minLength) {
        return [];
    }
    const queryLower = query.toLowerCase();
    return ASSISTANT_ENTITY_TYPES.map((entry) => ({
        entry,
        score: phraseMatchScore(entry, queryLower),
    }))
        .filter((row) => row.score >= 0)
        .sort((left, right) => {
            if (left.score !== right.score) {
                return left.score - right.score;
            }
            const leftLen = String(left.entry.phrase).length;
            const rightLen = String(right.entry.phrase).length;
            if (leftLen !== rightLen) {
                return leftLen - rightLen;
            }
            return String(left.entry.phrase).localeCompare(String(right.entry.phrase), undefined, {
                sensitivity: "base",
            });
        })
        .slice(0, limit)
        .map((row) => ({
            kind: "entity",
            id: `entity:${row.entry.nodeType}`,
            label: row.entry.label,
            nodeType: row.entry.nodeType,
            insertText: row.entry.phrase,
            hint: "Type",
        }));
}

function matchPhraseCatalog(catalog, token, { limit = 4, minLength = 2, mapRow } = {}) {
    const query = String(token || "").trim();
    if (query.length < minLength) {
        return [];
    }
    const queryLower = query.toLowerCase();
    return catalog
        .map((entry) => ({
            entry,
            score: phraseMatchScore(entry, queryLower),
        }))
        .filter((row) => row.score >= 0)
        .sort((left, right) => {
            if (left.score !== right.score) {
                return left.score - right.score;
            }
            const leftLen = String(left.entry.phrase).length;
            const rightLen = String(right.entry.phrase).length;
            if (leftLen !== rightLen) {
                return leftLen - rightLen;
            }
            return String(left.entry.phrase).localeCompare(String(right.entry.phrase), undefined, {
                sensitivity: "base",
            });
        })
        .slice(0, limit)
        .map((row) => mapRow(row.entry));
}

export function matchAssistantSuggestGraphTerms(token, options = {}) {
    return matchPhraseCatalog(ASSISTANT_GRAPH_TERMS, token, {
        ...options,
        mapRow: (entry) => ({
            kind: "term",
            id: `term:${entry.phrase}`,
            label: entry.label,
            insertText: entry.phrase,
            hint: "Graph",
        }),
    });
}

export function matchAssistantSuggestPhrases(token, { limit = 4, minLength = 2 } = {}) {
    const query = String(token || "").trim();
    if (query.length < minLength) {
        return [];
    }
    const queryLower = query.toLowerCase();
    return ASSISTANT_ACTION_PHRASES.map((entry) => ({
        entry,
        score: phraseMatchScore(entry, queryLower),
    }))
        .filter((row) => row.score >= 0)
        .sort((left, right) => {
            if (left.score !== right.score) {
                return left.score - right.score;
            }
            return String(left.entry.phrase).localeCompare(String(right.entry.phrase), undefined, {
                sensitivity: "base",
            });
        })
        .slice(0, limit)
        .map((row) => ({
            kind: "phrase",
            id: `phrase:${row.entry.phrase}`,
            label: row.entry.label,
            actionId: row.entry.actionId,
            insertText: row.entry.phrase,
            hint: "View",
        }));
}

/** True when the word before the active token is show or hide. */
export function isViewModifierContext(text, tokenStart) {
    const before = String(text || "")
        .slice(0, Math.max(0, Number(tokenStart) || 0))
        .trimEnd();
    if (!before) {
        return false;
    }
    const lastWord = before.split(/\s+/).pop()?.toLowerCase() || "";
    return VIEW_MODIFIER_VERBS.has(lastWord);
}

/** True when the caret is in a token that likely names a graph node (not an action verb). */
export function looksLikeNodeLabelToken(token) {
    const value = String(token || "").trim();
    if (value.length < 2) {
        return false;
    }
    if (/^[A-Z][A-Z0-9.-]*$/.test(value)) {
        return true;
    }
    if (/^\d/.test(value)) {
        return true;
    }
    return false;
}

/** True when the word before the active token is an assistant action verb. */
export function expectsNounTarget(text, tokenStart, verbs = VERB_LOOKUP) {
    const before = String(text || "")
        .slice(0, Math.max(0, Number(tokenStart) || 0))
        .trimEnd();
    if (!before) {
        return false;
    }
    const lastWord = before.split(/\s+/).pop()?.toLowerCase() || "";
    return verbs.has(lastWord);
}

export function buildAssistantAutocompleteSuggestions(
    { token, text, tokenStart, graphNodes } = {},
    { limit = 10, actionLimit = 6, nodeLimit = 8, minLength = 2 } = {}
) {
    const query = String(token || "").trim();
    if (query.length < minLength) {
        return [];
    }

    const nounContext = expectsNounTarget(text, tokenStart);
    const viewModifierContext = isViewModifierContext(text, tokenStart);
    const geneLike = looksLikeNodeLabelToken(query);

    let actions = [];
    if (!nounContext && !geneLike) {
        actions = matchAssistantSuggestActions(query, { limit: actionLimit, minLength });
    }

    let phrases = [];
    if (!geneLike) {
        phrases = matchAssistantSuggestPhrases(query, { limit: 4, minLength });
    }

    let entityTypes = [];
    if (!geneLike && !viewModifierContext) {
        entityTypes = matchAssistantSuggestEntityTypes(query, { limit: 4, minLength });
    }

    let graphTerms = [];
    if (!geneLike && !viewModifierContext) {
        graphTerms = matchAssistantSuggestGraphTerms(query, { limit: 4, minLength });
    }

    let nodes = [];
    const shouldMatchNodes =
        !viewModifierContext &&
        (nounContext ||
            geneLike ||
            (actions.length === 0 &&
                phrases.length === 0 &&
                entityTypes.length === 0 &&
                graphTerms.length === 0));
    if (shouldMatchNodes) {
        nodes = matchAssistantSuggestNodes(query, graphNodes, { limit: nodeLimit, minLength }).map(
            (node) => ({
                kind: "node",
                id: `node:${node.node_id}`,
                node_id: node.node_id,
                label: node.label,
                typeLabel: node.typeLabel,
                insertText: node.label,
                hint: node.typeLabel,
            })
        );
    }

    const merged = [...actions, ...entityTypes, ...graphTerms, ...phrases, ...nodes];
    const buckets = [actions, entityTypes, graphTerms, phrases, nodes].filter(
        (bucket) => bucket.length > 0
    );
    if (buckets.length <= 1) {
        return merged.slice(0, limit);
    }
    const cap = Math.max(1, Math.floor(limit / buckets.length));
    return [
        ...actions.slice(0, cap),
        ...entityTypes.slice(0, cap),
        ...graphTerms.slice(0, cap),
        ...phrases.slice(0, cap),
        ...nodes.slice(0, cap),
    ].slice(0, limit);
}
