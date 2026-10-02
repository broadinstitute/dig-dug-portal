import { createLLMClient } from "@/utils/llmClient";

const SLOT_SHAPE =
    "{\n" +
    '  "slots": {\n' +
    '    "target": {"value": string|null, "confidence": "high"|"medium"|"low", "resolved_id": string|null},\n' +
    '    "perturbation": {"value": string|null, "confidence": "high"|"medium"|"low", "resolved_id": string|null},\n' +
    '    "outcome": {"value": string|null, "confidence": "high"|"medium"|"low", "resolved_id": string|null, "factor_search_query": string|null},\n' +
    '    "modifiers": {\n' +
    '      "cell_line": {"value": string|null, "confidence": "high"|"medium"|"low"},\n' +
    '      "genetic_background": {"value": string|null, "confidence": "high"|"medium"|"low"},\n' +
    '      "dose_timepoint": {"value": string|null, "confidence": "high"|"medium"|"low"},\n' +
    '      "tissue": {"value": string|null, "confidence": "high"|"medium"|"low"},\n' +
    '      "comparator": {"value": string|null, "confidence": "high"|"medium"|"low"}\n' +
    "    }\n" +
    "  },\n" +
    '  "missing_required_slots": ["target"|"perturbation"|"outcome", ...],\n' +
    '  "parse_confidence_overall": "high"|"medium"|"low",\n' +
    '  "rubric": {\n' +
    '    "precision": {"scored": boolean, "rating": "high"|"medium"|"low"|null, "rationale": "..."},\n' +
    '    "falsifiability": {"scored": boolean, "rating": "high"|"medium"|"low"|null, "rationale": "..."}\n' +
    "  }\n" +
    "}";

const SLOT_DEFINITIONS =
    "Definitions:\n" +
    "- target: a specific, named gene, protein, or molecular pathway component (e.g. \"SIRT1\", \"AMPK\", \"the mTOR pathway\"). " +
    'Organelles, cell types, tissues, and generic biological processes (e.g. "mitochondria", "liver cells", "mitochondrial dysfunction") ' +
    "do NOT qualify on their own — if the text only names one of these without a specific gene/protein/pathway, set target to null " +
    'and include "target" in missing_required_slots.\n' +
    "- perturbation: a specific, deliberate experimental manipulation applied to the target (knockdown, knockout, overexpression, a named " +
    "drug/inhibitor, CRISPR edit). Passive environmental, dietary, or dose conditions (e.g. \"high-sugar conditions\", \"hypoxia\", \"high " +
    'glucose\") do NOT qualify as a perturbation — those belong in modifiers.dose_timepoint instead. If the text only describes a ' +
    'condition or an observational/correlative claim with no deliberate manipulation, set perturbation to null and include "perturbation" ' +
    "in missing_required_slots.\n" +
    "- outcome: the measured biological output or phenotype (reduced OCR, apoptosis, proliferation), or a disease/mechanism/process " +
    "named as the phenotype side of a knowledge-graph query.\n" +
    'If the text names more than one target, perturbation, or outcome, join them into one comma-separated string value (e.g. "SIRT1, AMPK") rather than picking just one.\n\n' +
    "resolved_id — for target and perturbation, the canonical name a genomics knowledge graph would index this entity under, " +
    'if you can confidently supply one; null otherwise. For a gene/protein, this MUST be the official HGNC gene symbol, not a common ' +
    'alias or brand/drug name — e.g. value "PD-1" -> resolved_id "PDCD1", value "HER2" -> resolved_id "ERBB2", value ' +
    '"Keytruda"/"Pembrolizumab" -> resolved_id "PDCD1" (the gene the drug targets, since that is what a gene-centric KG indexes). ' +
    "For outcome, resolved_id is the shortest canonical disease/phenotype name implied by the outcome if one exists (e.g. value " +
    '"restores IFN-gamma secretion in exhausted T cells" -> resolved_id "T cell exhaustion"); null if the outcome is a lab-measured ' +
    "readout with no corresponding disease/phenotype concept — do not force one.\n\n" +
    "factor_search_query — outcome only. A short phrase used as the ONLY input to a semantic (embedding) Factor search. " +
    "It is NOT resolved_id. Put the canonical disease/phenotype name in outcome.resolved_id; put the retrieval phrase here.\n" +
    "Hard requirements (violations are wrong):\n" +
    "- Exactly 3 or 4 words. No commas, no semicolon lists, no stacked synonyms.\n" +
    "- Shape: [anatomical/cellular site] + [pathological process] when possible " +
    '(best: "proximal tubule transport disorder"). If the phenotype is already embedding-safe, a short phenotype phrase is OK ' +
    '(e.g. "T cell exhaustion").\n' +
    "- MUST NOT contain gene/protein symbols (CLCN5, PDCD1, …). Those belong only in target.resolved_id.\n" +
    "- MUST NOT contain ambiguous eponyms or their root words (Dent, Still, Hunter, …). Replace with physiology; never append the eponym.\n" +
    "- MUST NOT concatenate disease name + gene + tissue + synonyms into one string.\n" +
    "Worked example for Dent disease / proximal-tubule Fanconi-like outcome:\n" +
    '- GOOD factor_search_query: "proximal tubule transport disorder" ' +
    "(matches Factor labels closely; high similarity).\n" +
    '- BAD factor_search_query: "Dent disease CLCN5 proximal tubule renal Fanconi nephropathy" ' +
    "(kitchen-sink; keeps Dent + gene; dilutes the vector — never do this).\n" +
    "- If outcome value is null, set factor_search_query to null.\n\n";

const RUBRIC_RULES =
    "Rubric rules (only when scoring a hypothesis):\n" +
    "1. Precision = whether the hypothesis names specific, measurable entities rather than vague/qualitative language. A missing " +
    '(null) target or perturbation is strong evidence precision cannot be rated "high" — score it "low" or "medium" and say why, ' +
    "not high just because the outcome or a condition is specific.\n" +
    "2. Falsifiability = whether the hypothesis makes a directional, testable claim a plausible experiment could show false — not just an " +
    'observation or a question. Non-directional/correlative phrasing ("is involved in", "is associated with", "contributes to", "plays a ' +
    'role in") is not falsifiable on its own — score it "low" and explain that the claim needs a directional form (e.g. "blocking X ' +
    'prevents Y") to be testable.\n' +
    '3. If you cannot confidently judge an axis from the text alone, set "scored": false, "rating": null, and explain why in "rationale". Never guess a default rating.\n';

const SHARED_SLOT_RULES =
    "Slot rules (always):\n" +
    '1. If a modifier is not mentioned in the text, set {"value": null, "confidence": "high"} — you are confident it is absent, not uncertain. Do not invent information not present in the text.\n' +
    '2. Only mark a slot\'s confidence "high" when its value is a specific entity/action stated directly in the text. If you had to ' +
    'infer, generalize, or stretch a generic term into a slot, either mark confidence "low" or set the slot to null instead — do not ' +
    "present an inferred value as equally certain as an explicit one.\n" +
    "3. No explanation outside the JSON. No markdown.";

/** Standalone Evaluate hypothesis — always full Module A (no classify). */
const SYSTEM_PROMPT_EVALUATE =
    "You evaluate a free-text biological hypothesis for structural quality and parse it into structured slots.\n\n" +
    "Respond with strict JSON only, matching exactly this shape:\n" +
    SLOT_SHAPE +
    "\n\n" +
    SLOT_DEFINITIONS +
    RUBRIC_RULES +
    SHARED_SLOT_RULES;

/**
 * Search CFDE KG free-text path — one call that classifies mechanical hypothesis
 * requirements, then either full-evaluates or parses KG search slots only.
 */
const SYSTEM_PROMPT_CLASSIFY =
    "You parse free text for a CFDE knowledge-graph search. First classify whether the text " +
    "meets the mechanical requirements of a biological hypothesis; then fill structured slots.\n\n" +
    "Respond with strict JSON only, matching exactly this shape:\n" +
    "{\n" +
    '  "input_kind": "hypothesis"|"free_text",\n' +
    '  "slots": {\n' +
    '    "target": {"value": string|null, "confidence": "high"|"medium"|"low", "resolved_id": string|null},\n' +
    '    "perturbation": {"value": string|null, "confidence": "high"|"medium"|"low", "resolved_id": string|null},\n' +
    '    "outcome": {"value": string|null, "confidence": "high"|"medium"|"low", "resolved_id": string|null, "factor_search_query": string|null},\n' +
    '    "modifiers": {\n' +
    '      "cell_line": {"value": string|null, "confidence": "high"|"medium"|"low"},\n' +
    '      "genetic_background": {"value": string|null, "confidence": "high"|"medium"|"low"},\n' +
    '      "dose_timepoint": {"value": string|null, "confidence": "high"|"medium"|"low"},\n' +
    '      "tissue": {"value": string|null, "confidence": "high"|"medium"|"low"},\n' +
    '      "comparator": {"value": string|null, "confidence": "high"|"medium"|"low"}\n' +
    "    }\n" +
    "  },\n" +
    '  "missing_required_slots": ["target"|"perturbation"|"outcome", ...],\n' +
    '  "parse_confidence_overall": "high"|"medium"|"low",\n' +
    '  "rubric": {\n' +
    '    "precision": {"scored": boolean, "rating": "high"|"medium"|"low"|null, "rationale": "..."},\n' +
    '    "falsifiability": {"scored": boolean, "rating": "high"|"medium"|"low"|null, "rationale": "..."}\n' +
    "  }\n" +
    "}\n\n" +
    "Classification (input_kind):\n" +
    '- "hypothesis": you can fill ALL three required slots (target, perturbation, outcome) using the definitions below — ' +
    "including a deliberate experimental perturbation (not only a passive condition or correlative claim).\n" +
    '- "free_text": otherwise (gap questions, entity lists, gene-only or mechanism-only text, observational claims missing ' +
    "a deliberate perturbation, etc.). Still parse whatever slots you can for KG retrieval; leave missing ones null.\n\n" +
    SLOT_DEFINITIONS +
    "When input_kind is \"hypothesis\":\n" +
    "- Score the rubric normally (precision and falsifiability) — quality may still be low even when mechanical slots are present.\n\n" +
    "When input_kind is \"free_text\":\n" +
    '- Set both rubric axes to {"scored": false, "rating": null, "rationale": "..."} explaining that the input is not a ' +
    "mechanical hypothesis (do not invent precision/falsifiability ratings).\n" +
    "- Prefer extracting a gene into target and/or a disease/mechanism/process into outcome (+ factor_search_query) for KG search.\n" +
    "- Do not invent a perturbation just to force hypothesis classification.\n\n" +
    SHARED_SLOT_RULES;

const REQUIRED_SLOT_IDS = ["target", "perturbation", "outcome"];
const MODIFIER_IDS = ["cell_line", "genetic_background", "dose_timepoint", "tissue", "comparator"];
export const INPUT_KIND_HYPOTHESIS = "hypothesis";
export const INPUT_KIND_FREE_TEXT = "free_text";

function normalizeSlot(slot) {
    if (!slot || typeof slot !== "object") {
        return { value: null, confidence: "low", resolvedId: null };
    }
    const value = typeof slot.value === "string" && slot.value.trim() ? slot.value.trim() : null;
    const confidence = ["high", "medium", "low"].includes(slot.confidence) ? slot.confidence : "low";
    const resolvedId =
        typeof slot.resolved_id === "string" && slot.resolved_id.trim()
            ? slot.resolved_id.trim()
            : typeof slot.resolvedId === "string" && slot.resolvedId.trim()
              ? slot.resolvedId.trim()
              : null;
    return { value, confidence, resolvedId };
}

function normalizeOutcomeSlot(slot) {
    const base = normalizeSlot(slot);
    if (!slot || typeof slot !== "object") {
        return { ...base, factorSearchQuery: null };
    }
    const fromSnake =
        typeof slot.factor_search_query === "string" && slot.factor_search_query.trim()
            ? slot.factor_search_query.trim()
            : null;
    const fromCamel =
        typeof slot.factorSearchQuery === "string" && slot.factorSearchQuery.trim()
            ? slot.factorSearchQuery.trim()
            : null;
    return { ...base, factorSearchQuery: fromSnake || fromCamel };
}

function normalizeRubricAxis(axis) {
    if (!axis || typeof axis !== "object" || axis.scored !== true) {
        return {
            scored: false,
            rating: null,
            rationale:
                axis && typeof axis.rationale === "string" && axis.rationale.trim()
                    ? axis.rationale.trim()
                    : "Insufficient basis to score from the text alone.",
        };
    }
    const rating = ["high", "medium", "low"].includes(axis.rating) ? axis.rating : null;
    return {
        scored: rating !== null,
        rating,
        rationale: typeof axis.rationale === "string" ? axis.rationale.trim() : "",
    };
}

function normalizeInputKind(parsed, { classifyInput }) {
    const raw = parsed && parsed.input_kind;
    if (raw === INPUT_KIND_FREE_TEXT || raw === INPUT_KIND_HYPOTHESIS) {
        return raw;
    }
    if (!classifyInput) {
        return INPUT_KIND_HYPOTHESIS;
    }
    const slots = (parsed && parsed.slots) || {};
    const hasAllRequired = REQUIRED_SLOT_IDS.every((id) => normalizeSlot(slots[id]).value);
    return hasAllRequired ? INPUT_KIND_HYPOTHESIS : INPUT_KIND_FREE_TEXT;
}

function normalizeEvaluation(parsed, options = {}) {
    const classifyInput = Boolean(options.classifyInput);
    const slots = (parsed && parsed.slots) || {};
    const modifiersRaw = slots.modifiers || {};
    const modifiers = MODIFIER_IDS.reduce((acc, id) => {
        acc[id] = normalizeSlot(modifiersRaw[id]);
        return acc;
    }, {});

    const missingRequiredSlots = Array.isArray(parsed && parsed.missing_required_slots)
        ? parsed.missing_required_slots.filter((id) => REQUIRED_SLOT_IDS.includes(id))
        : REQUIRED_SLOT_IDS.filter((id) => !normalizeSlot(slots[id]).value);

    const parseConfidenceOverall = ["high", "medium", "low"].includes(parsed && parsed.parse_confidence_overall)
        ? parsed.parse_confidence_overall
        : "low";

    const inputKind = normalizeInputKind(parsed, { classifyInput });
    const rubric = (parsed && parsed.rubric) || {};

    let precision = normalizeRubricAxis(rubric.precision);
    let falsifiability = normalizeRubricAxis(rubric.falsifiability);
    if (inputKind === INPUT_KIND_FREE_TEXT) {
        precision = normalizeRubricAxis({
            scored: false,
            rationale:
                (rubric.precision && rubric.precision.rationale) ||
                "Input does not meet mechanical hypothesis requirements; rubric not scored.",
        });
        falsifiability = normalizeRubricAxis({
            scored: false,
            rationale:
                (rubric.falsifiability && rubric.falsifiability.rationale) ||
                "Input does not meet mechanical hypothesis requirements; rubric not scored.",
        });
    }

    return {
        inputKind,
        slots: {
            target: normalizeSlot(slots.target),
            perturbation: normalizeSlot(slots.perturbation),
            outcome: normalizeOutcomeSlot(slots.outcome),
            modifiers,
        },
        missingRequiredSlots,
        parseConfidenceOverall,
        rubric: {
            precision,
            falsifiability,
        },
    };
}

/** Unscored/empty-slot result used when the LLM call fails outright (bounded honesty: never fake a rating). */
export function emptyHypothesisEvaluation(reason) {
    return normalizeEvaluation({
        input_kind: INPUT_KIND_HYPOTHESIS,
        rubric: {
            precision: { scored: false, rationale: reason },
            falsifiability: { scored: false, rationale: reason },
        },
    });
}

/**
 * Parses text into slots (and optionally scores precision/falsifiability).
 *
 * @param {string} hypothesisText
 * @param {{ classifyInput?: boolean }} [options]
 *   classifyInput: true for Search CFDE KG — classify hypothesis vs free_text in one call.
 *   classifyInput: false/omit for welcome Evaluate — always full Module A.
 * @returns {Promise<object>} normalized evaluation
 */
export function extractHypothesisEvaluation(hypothesisText, options = {}) {
    const classifyInput = Boolean(options.classifyInput);
    const client = createLLMClient({
        llm: "bedrock",
        system_prompt: classifyInput ? SYSTEM_PROMPT_CLASSIFY : SYSTEM_PROMPT_EVALUATE,
        expectJson: true,
    });

    return new Promise((resolve, reject) => {
        client.sendPrompt({
            userPrompt: hypothesisText,
            onResponse: (raw) => {
                try {
                    const parsed = JSON.parse(raw);
                    resolve(normalizeEvaluation(parsed, { classifyInput }));
                } catch (error) {
                    reject(error);
                }
            },
            onError: (error) =>
                reject(error || new Error(classifyInput ? "Input parse failed" : "Hypothesis evaluation failed")),
        });
    });
}

export { MODIFIER_IDS, REQUIRED_SLOT_IDS, normalizeEvaluation };
