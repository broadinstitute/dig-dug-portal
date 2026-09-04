import { createLLMClient } from "@/utils/llmClient";

/**
 * Post-retrieval relevance triage for the Biomarker KB bridge, mirroring
 * scopeKgRelevance.js's structure and label scheme for consistency — same
 * "annotate, never delete" bounded-honesty pattern, same conservative-default rule.
 *
 * Operates on the flat, entity-deduplicated biomarker list `findBiomarkerBridgeEvidence()`
 * produces (each biomarker may list several diseases/roles/genes if it was fetched via more
 * than one bridge disease) — not a per-disease-group structure.
 */
const SYSTEM_PROMPT =
    "You classify biomarkers found via a knowledge-graph bridge (mechanism factor -> " +
    "shared-gene disease -> BiomarkerKB) for relevance to a biological hypothesis.\n\n" +
    "This is a two-hop bridge, not a direct hit: a semantically-resolved mechanism (\"Factor\") " +
    "led to diseases sharing genes with that factor, and each biomarker below is linked to one " +
    "or more of those diseases in BiomarkerKB (see its `diseases` list). The biomarker's own " +
    "gene(s) may or may not be the hypothesis's actual target — judge each biomarker on its own " +
    "merits, not just because one of its diseases is a bridge disease.\n\n" +
    "For each biomarker, decide:\n" +
    '- "on_topic": the biomarker\'s genes include the hypothesis\'s target (or a stated ' +
    "perturbation entity), and at least one of its listed diseases plausibly matches the " +
    "hypothesis's own stated disease/system given its clinical role there.\n" +
    '- "same_domain_mismatched_context": the biomarker\'s gene(s) belong to the same ' +
    "pathway/mechanism family as the hypothesis but are not the target itself, or none of its " +
    "listed diseases match what the hypothesis actually studies.\n" +
    '- "unrelated": the biomarker\'s gene(s)/entity have no plausible mechanistic connection to ' +
    "the hypothesis at all.\n\n" +
    "Rules:\n" +
    "1. A biomarker whose gene list contains an exact match to the hypothesis's target is " +
    'relevant to consider, but "on_topic" additionally requires at least one of its listed ' +
    "diseases to match the hypothesis's own stated disease/system (or a directly stated " +
    'comparator condition) — an exact gene match where every listed disease is a mismatch is ' +
    '"same_domain_mismatched_context", not "on_topic", even if you can construct a mechanistic ' +
    'story connecting them. Do not upgrade a biomarker to "on_topic" solely because its gene is ' +
    "an exact match while every listed disease is unrelated to the hypothesis.\n" +
    "2. Do not assume relevance just because one of the biomarker's diseases is a bridge disease " +
    "found via the resolved factor — that bridge only explains why this biomarker was fetched, " +
    "not that the biomarker itself is relevant.\n" +
    "3. If you cannot confidently distinguish between two labels, choose the more conservative " +
    '(lower) one and say why — never default to "on_topic".\n' +
    "4. Be internally consistent: biomarkers that share the same gene(s) and the same set of " +
    "mismatched diseases must get the same label — do not let one get upgraded by a more " +
    "elaborate rationale than another.\n" +
    "5. One sentence per rationale. No markdown, no explanation outside the JSON.\n\n" +
    'Respond with strict JSON only: {"classifications": [{"index": number, "label": ' +
    '"on_topic"|"same_domain_mismatched_context"|"unrelated", "rationale": "..."}]}';

const VALID_LABELS = ["on_topic", "same_domain_mismatched_context", "unrelated"];

function describeBiomarker(biomarker) {
    return {
        biomarker: biomarker.displayLabel || biomarker.biomarkerLabel,
        genes: biomarker.genes || null,
        roles: biomarker.roles || null,
        diseases: biomarker.diseases || null,
        geneSharedWithFactor: Boolean(biomarker.geneSharedWithFactor),
    };
}

/**
 * Classifies every biomarker in the flat list in one call, made once after
 * findBiomarkerBridgeEvidence() fully resolves — same reasoning as the KG-evidence
 * triage: one consistent threshold across the whole result set, not one call per disease.
 *
 * @returns {Promise<Array<{ index: number, label: string|null, rationale: string }>>}
 *   Empty array when there is nothing to classify.
 */
export async function classifyBiomarkerRelevance({
    hypothesisText,
    targetText,
    targetResolvedId,
    outcomeText,
    outcomeResolvedId,
    biomarkers,
} = {}) {
    const list = Array.isArray(biomarkers) ? biomarkers : [];
    if (!list.length) {
        return [];
    }

    const userPrompt = JSON.stringify({
        hypothesis: hypothesisText || "",
        target: targetResolvedId || targetText || null,
        outcome: outcomeResolvedId || outcomeText || null,
        biomarkers: list.map((b, index) => ({ index, ...describeBiomarker(b) })),
    });

    const client = createLLMClient({
        llm: "bedrock",
        system_prompt: SYSTEM_PROMPT,
        expectJson: true,
    });

    const raw = await new Promise((resolve, reject) => {
        client.sendPrompt({
            userPrompt,
            onResponse: resolve,
            onError: (error) => reject(error || new Error("Biomarker relevance classification failed")),
        });
    });

    const parsed = JSON.parse(raw);
    const classifications = Array.isArray(parsed && parsed.classifications) ? parsed.classifications : [];

    return list.map((_, index) => {
        const match = classifications.find((c) => Number(c && c.index) === index);
        const label = match && VALID_LABELS.includes(match.label) ? match.label : null;
        const rationale = match && typeof match.rationale === "string" ? match.rationale.trim() : "";
        return { index, label, rationale };
    });
}

/** Non-destructively annotates biomarkers with `.relevance = {label, rationale}`. Unmatched entries are left untouched. */
export function mergeBiomarkerRelevance(biomarkers, classifications) {
    if (!classifications || !classifications.length) {
        return biomarkers;
    }
    return biomarkers.map((biomarker, index) => {
        const match = classifications.find((c) => c.index === index);
        if (!match || !match.label) {
            return biomarker;
        }
        return { ...biomarker, relevance: { label: match.label, rationale: match.rationale } };
    });
}
