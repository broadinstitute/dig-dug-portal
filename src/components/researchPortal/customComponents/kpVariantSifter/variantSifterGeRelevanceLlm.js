import {
    classifyInteractiveCandidates,
    getInteractiveHealth,
} from "@/utils/revealKgApi.js";
import { sortedAnnotationKeys } from "./variantSifterGlobalEnrichmentData.js";

/** Fast model for GE tissue relevance (passed when the backend supports llm_model). */
export const GE_RELEVANCE_LLM_MODEL = "gpt-4.1-nano";

const CLASSIFY_BATCH_SIZE = 60;

export function buildGeAnnotationTissuePairs(annoData = {}) {
    const pairs = [];

    sortedAnnotationKeys(annoData).forEach((annotation) => {
        Object.keys(annoData[annotation] || {})
            .sort()
            .forEach((tissue) => {
                pairs.push({ annotation, tissue });
            });
    });

    return pairs;
}

export function uniqueTissueLabelsFromPairs(pairs = []) {
    return [...new Set(pairs.map((pair) => pair.tissue).filter(Boolean))].sort();
}

export function buildGeRelevancePrompt(session, pairs = []) {
    const phenotype = session?.phenotype?.name || "unknown phenotype";
    const description = session?.phenotype?.description || "";
    const ancestry = session?.ancestry || "Mixed";

    const parts = [
        `For ${phenotype} (${ancestry}), pick broad tissue categories that are biologically plausible.`,
        "Classify tissues only; ignore regulatory annotation type.",
    ];
    if (description) {
        parts.push(`Phenotype context: ${description}`);
    }
    parts.push(`Candidates: ${JSON.stringify(pairs)}`);
    return parts.join(" ");
}

export function buildGeTissueCandidates(tissueLabels = []) {
    return tissueLabels.map((tissue) => ({
        candidate: {
            node_id: tissue,
            label: tissue,
            node_type: "tissue",
            type: "tissue",
        },
    }));
}

function parseTissueRelevanceResults(items = [], tissueLabels = []) {
    const tissueLabelSet = new Set(tissueLabels);
    const relevantTissues = [];
    const rationaleById = {};

    items.forEach((item) => {
        const tissueLabel = item?.display_name || item?.candidate_id;
        if (!tissueLabel || !tissueLabelSet.has(tissueLabel)) {
            return;
        }
        rationaleById[tissueLabel] = item?.rationale || "";
        if (item?.relevance_label === "relevant") {
            relevantTissues.push(tissueLabel);
        }
    });

    return {
        relevantTissues,
        rationaleById,
    };
}

async function classifyTissueBatch({
    session,
    prompt,
    pairs,
    tissueLabels,
    candidates,
    batchIndex,
    totalBatches,
}) {
    return classifyInteractiveCandidates({
        anchor_items: [
            {
                label: session?.phenotype?.name || "phenotype",
                node_type: "trait",
                type: "trait",
            },
        ],
        context: prompt,
        target_type: "mixed",
        reducer: "mean",
        connection_scope: "direct",
        candidates,
        classify_novelty: false,
        classify_relevance: true,
        relevance_mode: "llm",
        relevance_threshold: 0.3,
        requested_label: "ge_relevance_tissue",
        llm_model: GE_RELEVANCE_LLM_MODEL,
        ge_pairs: pairs,
        batch_index: batchIndex,
        total_batches: totalBatches,
    });
}

export async function fetchInteractiveLlmHealth() {
    try {
        return await getInteractiveHealth();
    } catch (error) {
        const message = String(error?.message || "");
        if (message.includes("502") || message.toLowerCase().includes("bad gateway")) {
            return {
                llm_available: false,
                error:
                    "Interactive API proxy failed (502). Ensure dig-dug-server revealKg.apiBaseUrl or webpack devServer proxy points to a running cfde-reveal host.",
            };
        }
        return { llm_available: false, error: message || "Interactive API unavailable" };
    }
}

/**
 * Ask the interactive LLM which broad tissue categories are relevant for the
 * searched phenotype and ancestry. Annotation types are left unfiltered.
 */
export async function fetchGeRelevanceFromLlm({
    session,
    annoData = {},
    annotations = [],
    tissues = [],
}) {
    const health = await fetchInteractiveLlmHealth();
    if (!health?.llm_available) {
        throw new Error("LLM relevance filtering is not available in this environment.");
    }

    const pairs = buildGeAnnotationTissuePairs(annoData);
    const resolvedPairs =
        pairs.length > 0
            ? pairs
            : annotations.flatMap((annotation) =>
                  tissues.map((tissue) => ({ annotation, tissue }))
              );
    const tissueLabels =
        tissues.length > 0 ? [...tissues].sort() : uniqueTissueLabelsFromPairs(resolvedPairs);
    const annotationLabels =
        annotations.length > 0 ? [...annotations] : sortedAnnotationKeys(annoData);

    if (!tissueLabels.length) {
        return {
            llmUsed: false,
            tissueOnly: true,
            relevantAnnotations: annotationLabels,
            relevantTissues: [],
            rationaleById: {},
        };
    }

    const prompt = buildGeRelevancePrompt(session, resolvedPairs);
    const candidateBatches = [];
    const tissueCandidates = buildGeTissueCandidates(tissueLabels);
    for (let index = 0; index < tissueCandidates.length; index += CLASSIFY_BATCH_SIZE) {
        candidateBatches.push(tissueCandidates.slice(index, index + CLASSIFY_BATCH_SIZE));
    }

    const mergedItems = [];
    let llmUsed = false;

    for (let batchIndex = 0; batchIndex < candidateBatches.length; batchIndex += 1) {
        const payload = await classifyTissueBatch({
            session,
            prompt,
            pairs: resolvedPairs,
            tissueLabels,
            candidates: candidateBatches[batchIndex],
            batchIndex: batchIndex + 1,
            totalBatches: candidateBatches.length,
        });
        if (payload?.llm_used) {
            llmUsed = true;
        }
        mergedItems.push(...(payload?.items || []));
    }

    const parsed = parseTissueRelevanceResults(mergedItems, tissueLabels);
    return {
        llmUsed,
        tissueOnly: true,
        relevantAnnotations: annotationLabels,
        relevantTissues: parsed.relevantTissues,
        rationaleById: parsed.rationaleById,
    };
}
