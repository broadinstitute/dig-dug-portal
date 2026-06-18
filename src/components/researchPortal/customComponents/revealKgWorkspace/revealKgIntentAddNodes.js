/** Plan and run catalog searches from a research-intention description. */

import { createLLMClient } from "@/utils/llmClient";
import {
    CANVAS_ASSISTANT_PER_STEP_MAX,
    geneDiscoveryWorkflowGuidance,
} from "./revealKgBulkWorkflowGuidance.js";
import { searchCatalogRows } from "./revealKgAssistantAddNode.js";

export const INTENT_ADD_NODE_TYPES = ["gene_set", "factor", "trait"];

const INTENT_ADD_MODEL = "gpt-5-mini";
const MAX_PHRASES_PER_TYPE = 4;
const DEFAULT_LIMIT_PER_PHRASE = 3;
const MAX_TOTAL_NODES = CANVAS_ASSISTANT_PER_STEP_MAX;

const NODE_TYPE_LABELS = {
    gene_set: "gene set",
    factor: "mechanism",
    trait: "trait",
};

let intentPlannerClient = null;

function getIntentPlannerClient() {
    if (!intentPlannerClient) {
        intentPlannerClient = createLLMClient({
            llm: "openai",
            model: INTENT_ADD_MODEL,
            system_prompt: buildIntentAddSystemPrompt(),
        });
    }
    return intentPlannerClient;
}

export function abortIntentAddPlan() {
    intentPlannerClient?.abort();
}

function normalizeAllowedNodeTypes(nodeTypes) {
    if (!Array.isArray(nodeTypes)) {
        return null;
    }
    const allowed = nodeTypes.filter((type) => INTENT_ADD_NODE_TYPES.includes(type));
    return allowed.length ? allowed : null;
}

function parseTypesFromClause(clause) {
    const types = new Set();
    const text = String(clause || "");
    if (!text) {
        return types;
    }
    if (/\bgene[\s-]?sets?\b/i.test(text)) {
        types.add("gene_set");
    }
    if (/\b(?:mechanisms?|factors?)\b/i.test(text)) {
        types.add("factor");
    }
    if (/\btraits?\b/i.test(text)) {
        types.add("trait");
    }
    return types;
}

const INTENT_TARGET_CLAUSE =
    /\b(?:add|place|put|find(?:\s+me)?|get|fetch|search\s+for|show\s+me|identify|list|give\s+me)\s+(?:me\s+)?([\s\S]*?)(?=\s+associated\s+with|\s+related\s+to|\s+matching\b|\s+that\s+could\b|\s+about\b|\s+for\b|$)/i;

const INTENT_VERB =
    /\b(?:add|place|put|find(?:\s+me)?|get|fetch|search\s+for|show\s+me|identify|list|give\s+me)\b/i;

/**
 * When the user names node types to add/find (e.g. "find me gene sets associated with…"),
 * return only those types. Descriptive biology after "associated with" is not parsed as types.
 */
export function parseExplicitIntentNodeTypes(intention) {
    const query = String(intention || "").trim();
    if (!INTENT_VERB.test(query)) {
        return null;
    }

    if (/\bonly\s+gene[\s-]?sets?\b/i.test(query)) {
        return ["gene_set"];
    }
    if (/\bonly\s+(?:mechanisms?|factors?)\b/i.test(query)) {
        return ["factor"];
    }
    if (/\bonly\s+traits?\b/i.test(query)) {
        return ["trait"];
    }

    const clauseMatch = query.match(INTENT_TARGET_CLAUSE);
    const clause = clauseMatch?.[1]?.trim() || "";
    if (clause) {
        const fromClause = parseTypesFromClause(clause);
        if (fromClause.size) {
            return Array.from(fromClause);
        }
    }

    const types = new Set();
    if (/\b(?:add|find|get|search\s+for|show\s+me)\b[\s\S]*?\bgene[\s-]?sets?\b/i.test(query)) {
        types.add("gene_set");
    }
    if (
        /\b(?:add|find|get|search\s+for|show\s+me)\b[\s\S]*?\b(?:mechanisms?|factors?)\s+nodes?\b/i.test(
            query
        )
    ) {
        types.add("factor");
    }
    if (/\b(?:add|find|get|search\s+for|show\s+me)\b[\s\S]*?\btraits?\s+nodes?\b/i.test(query)) {
        types.add("trait");
    }
    return types.size ? Array.from(types) : null;
}

export function resolveIntentAddNodeTypes({
    intention = "",
    nodeTypes = null,
    userQuery = "",
} = {}) {
    return (
        normalizeAllowedNodeTypes(nodeTypes) ||
        parseExplicitIntentNodeTypes(userQuery) ||
        parseExplicitIntentNodeTypes(intention) ||
        null
    );
}

function resolveAllowedNodeTypes(intention, nodeTypes, userQuery = "") {
    return resolveIntentAddNodeTypes({ intention, nodeTypes, userQuery });
}

function buildIntentAddSystemPrompt() {
    return `You help users add biomedical graph nodes from a research intention.

Given a scientific question or goal, return JSON with catalog search phrases.

Rules:
- Do NOT include gene searches or gene symbols — genes are added later from mechanisms and gene sets on the graph.
- When allowed_node_types is provided, ONLY return searches for those node_type values. Other biology in the question is phrase context, not permission to add other types.
- Prefer short, catalog-friendly phrases (2–6 words) over full sentences.
- node_type must be one of: gene_set, factor, trait.
- limit per phrase: 1–5 (default 3).
- Return 1–${MAX_PHRASES_PER_TYPE} searches per allowed type.
- At most ${MAX_TOTAL_NODES} total nodes may be added in one intent-add step.
- explanation: one sentence on how phrases map to the intention.

Return ONLY valid JSON:
{
  "explanation": "string",
  "searches": [{ "node_type": "gene_set|factor|trait", "phrase": "string", "limit": 3 }]
}`;
}

function buildIntentAddUserPrompt(intention, sessionContext = "", allowedNodeTypes = null) {
    const context = String(sessionContext || "").trim();
    return JSON.stringify({
        research_intention: String(intention || "").trim(),
        session_context: context || undefined,
        allowed_node_types: allowedNodeTypes || undefined,
    });
}

export function parseIntentAddJson(rawString) {
    const clean = String(rawString || "")
        .replace(/```json|```/gi, "")
        .trim();
    if (!clean) {
        return null;
    }
    try {
        return JSON.parse(clean);
    } catch (error) {
        return null;
    }
}

function normalizeSearchEntry(entry) {
    const nodeType = String(entry?.node_type || "").trim();
    if (!INTENT_ADD_NODE_TYPES.includes(nodeType)) {
        return null;
    }
    const phrase = String(entry?.phrase || entry?.query || "").trim();
    if (!phrase) {
        return null;
    }
    const limit = Math.min(5, Math.max(1, Number(entry?.limit) || DEFAULT_LIMIT_PER_PHRASE));
    return { node_type: nodeType, phrase, limit };
}

export function validateIntentAddPlan(json, { allowedNodeTypes = null } = {}) {
    if (!json || typeof json !== "object") {
        throw new Error("Invalid intent add plan.");
    }
    const allowed = normalizeAllowedNodeTypes(allowedNodeTypes);
    const explanation = String(json.explanation || "").trim();
    const rawSearches = Array.isArray(json.searches) ? json.searches : [];
    let searches = rawSearches.map(normalizeSearchEntry).filter(Boolean);
    if (allowed?.length) {
        const allowedSet = new Set(allowed);
        searches = searches.filter((search) => allowedSet.has(search.node_type));
    }
    if (!searches.length) {
        const typeLabel = allowed?.length
            ? allowed.map((type) => NODE_TYPE_LABELS[type] || type).join(", ")
            : "gene set, mechanism, or trait";
        throw new Error(`No catalog searches matched the requested node type(s): ${typeLabel}.`);
    }
    const byType = { gene_set: 0, factor: 0, trait: 0 };
    const capped = [];
    for (const search of searches) {
        if (byType[search.node_type] >= MAX_PHRASES_PER_TYPE) {
            continue;
        }
        byType[search.node_type] += 1;
        capped.push(search);
    }
    return {
        explanation,
        searches: capped,
        allowed_node_types: allowed || INTENT_ADD_NODE_TYPES.slice(),
    };
}

function sendIntentPlannerPrompt(userPrompt) {
    const client = getIntentPlannerClient();
    return new Promise((resolve, reject) => {
        let settled = false;
        const finish = (error, response) => {
            if (settled) {
                return;
            }
            settled = true;
            if (error) {
                reject(error);
                return;
            }
            resolve(response);
        };
        client.sendPrompt({
            userPrompt,
            systemPrompt: buildIntentAddSystemPrompt(),
            onResponse: (response) => finish(null, response),
            onError: (error) => finish(error || new Error("Intent add planner failed.")),
            onEnd: () => {
                if (!settled) {
                    finish(new Error("Incomplete intent add planner response."));
                }
            },
        });
    });
}

export async function planIntentAddSearches(
    intention,
    { sessionContext = "", nodeTypes = null, userQuery = "" } = {}
) {
    const text = String(intention || "").trim();
    if (!text) {
        throw new Error("Describe your research intention first.");
    }
    const allowedNodeTypes = resolveAllowedNodeTypes(text, nodeTypes, userQuery);
    const raw = await sendIntentPlannerPrompt(
        buildIntentAddUserPrompt(text, sessionContext, allowedNodeTypes)
    );
    const json = parseIntentAddJson(raw);
    if (!json) {
        throw new Error("Could not parse intent add plan.");
    }
    return validateIntentAddPlan(json, { allowedNodeTypes });
}

export async function fetchIntentAddRows(apiClient, searches = [], { existingNodeIds = [] } = {}) {
    if (!apiClient) {
        throw new Error("Catalog search API is not configured.");
    }
    const seen = new Set(existingNodeIds || []);
    const rows = [];
    const searchLog = [];

    for (const search of searches) {
        const matches = await searchCatalogRows(
            apiClient,
            search.node_type,
            search.phrase,
            search.limit
        );
        searchLog.push({
            ...search,
            match_count: matches.length,
        });
        for (const row of matches) {
            if (!row?.node_id || seen.has(row.node_id)) {
                continue;
            }
            seen.add(row.node_id);
            rows.push(row);
            if (rows.length >= MAX_TOTAL_NODES) {
                return { rows, searchLog, capped: true };
            }
        }
    }

    return { rows, searchLog, capped: false };
}

export async function resolveIntentAddNodes(
    intention,
    session,
    { apiClient, sessionContext = "", nodeTypes = null, userQuery = "", onProgress } = {}
) {
    onProgress?.("Planning catalog searches…");
    const plan = await planIntentAddSearches(intention, {
        sessionContext,
        nodeTypes,
        userQuery,
    });
    onProgress?.("Searching catalog…");
    const existingNodeIds = (session?.graphNodes || []).map((node) => node.id).filter(Boolean);
    const { rows, searchLog, capped } = await fetchIntentAddRows(apiClient, plan.searches, {
        existingNodeIds,
    });
    if (!rows.length) {
        const typeLabel = (plan.allowed_node_types || [])
            .map((type) => NODE_TYPE_LABELS[type] || type)
            .join(", ");
        throw new Error(
            typeLabel
                ? `No matching ${typeLabel} nodes were found for that intention.`
                : "No matching gene sets, mechanisms, or traits were found for that intention."
        );
    }
    return {
        plan,
        rows,
        searchLog,
        capped,
        gene_guidance: capped ? geneDiscoveryWorkflowGuidance() : "",
    };
}
