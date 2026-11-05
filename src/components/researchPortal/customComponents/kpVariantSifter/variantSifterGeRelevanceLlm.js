/**
 * Phenotype→tissue relevance via DIG Bedrock gateway (`llm.hugeamp.org/bedrock`).
 * Replaces the previous cfde-reveal `/api/interactive/classify-candidates` (OpenAI) path.
 */
import { createLLMClient } from "@/utils/llmClient";
import { parseLlmJsonResponse } from "@/utils/llmUsageUtils";
import { sortedAnnotationKeys } from "./variantSifterGlobalEnrichmentData.js";

/** Bedrock uses the gateway default Claude model when omitted. */
export const GE_RELEVANCE_LLM_PROVIDER = "bedrock";

const CLASSIFY_BATCH_SIZE = 60;

const GE_RELEVANCE_SYSTEM_PROMPT = `You classify which broad tissue categories are biologically relevant to a human disease or trait phenotype.
Return JSON only with this shape:
{"relevant_tissues":["tissue_a","tissue_b"]}
Rules:
- Only include tissues from the provided list.
- Do not invent tissue names.
- Do not classify annotation types.
- If none are relevant, return {"relevant_tissues":[]}.`;

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
    parts.push('Respond with JSON only: {"relevant_tissues":["..."]}');
    return parts.join(" ");
}

function parseRelevantTissuesFromResponse(raw, tissueLabels = []) {
    const tissueLabelSet = new Set(tissueLabels);
    const { ok, json } = parseLlmJsonResponse(raw);
    if (!ok || !json || typeof json !== "object") {
        return { relevantTissues: [], parseOk: false };
    }

    const list = Array.isArray(json.relevant_tissues)
        ? json.relevant_tissues
        : Array.isArray(json.relevantTissues)
          ? json.relevantTissues
          : [];

    const relevantTissues = list
        .map((value) => String(value || "").trim())
        .filter((tissue) => tissueLabelSet.has(tissue));

    return { relevantTissues, parseOk: true };
}

function askBedrockJson({ systemPrompt, userPrompt }) {
    return new Promise((resolve, reject) => {
        const client = createLLMClient({
            llm: GE_RELEVANCE_LLM_PROVIDER,
            expectJson: true,
            system_prompt: systemPrompt,
        });
        client.sendPrompt({
            userPrompt,
            onResponse: (raw) => resolve(raw),
            onError: (err) =>
                reject(err instanceof Error ? err : new Error(String(err || "Bedrock request failed"))),
        });
    });
}

/**
 * Bedrock gateway health for the assistant UI.
 * Avoid a live model call on every open; treat the shared DIG Bedrock path as available
 * and surface call-time failures in the GE relevance result instead.
 */
export async function fetchInteractiveLlmHealth() {
    return {
        llm_available: true,
        provider: GE_RELEVANCE_LLM_PROVIDER,
        endpoint: "https://llm.hugeamp.org/bedrock",
    };
}

async function classifyTissueBatch({ session, tissueLabels }) {
    const prompt = buildGeRelevancePrompt(session, tissueLabels);
    const raw = await askBedrockJson({
        systemPrompt: GE_RELEVANCE_SYSTEM_PROMPT,
        userPrompt: prompt,
    });
    const parsed = parseRelevantTissuesFromResponse(raw, tissueLabels);
    if (!parsed.parseOk) {
        throw new Error("Could not parse Bedrock tissue-relevance JSON.");
    }
    return parsed.relevantTissues;
}

/**
 * Ask Bedrock which broad tissue categories are relevant for the searched phenotype.
 * Variant Sifter GE data has no novelty scores; filtering is phenotype↔tissue relevance only.
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

    try {
        const relevant = new Set();
        for (let index = 0; index < tissueLabels.length; index += CLASSIFY_BATCH_SIZE) {
            const batch = tissueLabels.slice(index, index + CLASSIFY_BATCH_SIZE);
            const batchRelevant = await classifyTissueBatch({
                session,
                tissueLabels: batch,
            });
            batchRelevant.forEach((tissue) => relevant.add(tissue));
        }

        return {
            llmUsed: true,
            tissueOnly: true,
            filterComplete: true,
            relevantAnnotations: annotationLabels,
            relevantTissues: [...relevant].sort(),
            rationaleById: {},
        };
    } catch (error) {
        return {
            llmUsed: false,
            tissueOnly: true,
            filterComplete: true,
            relevantAnnotations: annotationLabels,
            relevantTissues: [],
            rationaleById: {},
            error:
                error?.message ||
                "Bedrock tissue-relevance classification failed.",
        };
    }
}
