import {
    classifyInteractiveCandidates,
    getInteractiveHealth,
} from "@/utils/revealKgApi.js";
import { sortedAnnotationKeys } from "./variantSifterGlobalEnrichmentData.js";
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

/**
 * Phenotype→tissue relevance only.
 * Variant Sifter GE data has no novelty scores, so we never ask the LLM for novelty
 * labels or rationales — just which tissues are relevant to the phenotype.
 */
export function buildGeRelevancePrompt(session, tissueLabels = []) {
    const phenotype = session?.phenotype?.name || "unknown phenotype";
    const description = session?.phenotype?.description || "";

    const parts = [
        `Classify which broad tissue categories are biologically relevant to the phenotype ${phenotype}.`,
        "For each tissue, decide only whether it is relevant or irrelevant to this phenotype.",
        "Do not classify annotation types.",
    ];
    if (description) {
        parts.push(`Phenotype description: ${description}.`);
    }
    parts.push(`Tissues: ${JSON.stringify(tissueLabels)}.`);
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

    items.forEach((item) => {
        const tissueLabel = item?.display_name || item?.candidate_id;
        if (!tissueLabel || !tissueLabelSet.has(tissueLabel)) {
            return;
        }
        if (item?.relevance_label === "relevant") {
            relevantTissues.push(tissueLabel);
        }
    });

    return { relevantTissues };
}

async function classifyTissueBatch({
    session,
    prompt,
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
        // VS has no novelty scores for these tissues; relevance-only classify path.
        llm_model: GE_RELEVANCE_LLM_MODEL,
        batch_index: batchIndex,
        total_batches: totalBatches,
        tissue_labels: tissueLabels,
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
 * searched phenotype. Variant Sifter GE data has no novelty scores; filtering is
 * phenotype↔tissue relevance only. Annotation types stay unfiltered.
 */
export async function fetchGeRelevanceFromLlm({
    session,
    annoData = {},
    annotations = [],
    tissues = [],
}) {
    const health = await fetchInteractiveLlmHealth();
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

    if (!health?.llm_available) {
        return {
            llmUsed: false,
            tissueOnly: true,
            filterComplete: true,
            relevantAnnotations: annotationLabels,
            relevantTissues: [],
            rationaleById: {},
            error:
                health?.error ||
                "LLM relevance filtering is not available in this environment.",
        };
    }

    if (!tissueLabels.length) {
        return {
            llmUsed: false,
            tissueOnly: true,
            filterComplete: true,
            relevantAnnotations: annotationLabels,
            relevantTissues: [],
            rationaleById: {},
        };
    }

    const prompt = buildGeRelevancePrompt(session, tissueLabels);
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
        filterComplete: true,
        relevantAnnotations: annotationLabels,
        relevantTissues: parsed.relevantTissues,
        rationaleById: {},
    };
}
