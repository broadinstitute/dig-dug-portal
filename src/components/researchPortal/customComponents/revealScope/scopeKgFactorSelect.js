import { createLLMClient } from "@/utils/llmClient";

/**
 * After semantic factor search returns many candidates, pick the mechanism Factor(s)
 * whose themes best match the hypothesis outcome / mechanism — not merely the highest
 * embedding scores (which can favor popular but off-theme disease contexts).
 *
 * Cap is MAX_SELECT (5): the model may return fewer when only some candidates are
 * genuinely relevant. Floor is 1 whenever any candidates exist.
 */

export const MAX_SELECTED_FACTORS = 5;

const SYSTEM_PROMPT =
    "You select which CFDE REVEAL KG mechanism Factors best match a biological hypothesis.\n\n" +
    "You are given the hypothesis (and its parsed target/outcome) plus a ranked list of " +
    "candidate Factors from a semantic search. Each candidate has a label, optional disease " +
    "context (cfde_disease), and a similarity score.\n\n" +
    `Select between 1 and ${MAX_SELECTED_FACTORS} candidate indices — only those whose biological ` +
    "mechanism is genuinely relevant to what the hypothesis is claiming or testing (the outcome / " +
    "mechanism side). Do NOT pad the list to fill the maximum. If only one candidate is on-theme, " +
    "return just that one. If several are on-theme, return up to " +
    `${MAX_SELECTED_FACTORS}, ordered best-first.\n\n` +
    "Rules:\n" +
    "1. Prefer mechanism/pathway/process theme alignment with the hypothesis outcome over " +
    "disease-label overlap alone.\n" +
    "2. Exclude candidates that only share a disease name while describing a different pathway.\n" +
    "3. Order selected indices best-match first; break remaining ties with higher score.\n" +
    "4. Never invent an index that is not in the candidate list. Deduplicate indices.\n" +
    "5. Always return at least one index when candidates exist.\n" +
    "6. One sentence rationale covering the set. No markdown.\n\n" +
    'Respond with strict JSON only: {"indices": number[], "rationale": "..."}';

/**
 * @param {{
 *   hypothesisText?: string,
 *   targetText?: string,
 *   targetResolvedId?: string,
 *   outcomeText?: string,
 *   outcomeResolvedId?: string,
 *   candidates: Array<{ iri: string, label: string, factor?: string, cfdeDisease?: string, score?: number|null }>,
 *   maxSelect?: number,
 * }} params
 * @returns {Promise<{ factors: object[], indices: number[], rationale: string } | null>}
 */
export async function selectClosestFactors({
    hypothesisText,
    targetText,
    targetResolvedId,
    outcomeText,
    outcomeResolvedId,
    candidates,
    maxSelect = MAX_SELECTED_FACTORS,
} = {}) {
    const list = Array.isArray(candidates) ? candidates.filter(Boolean) : [];
    if (!list.length) return null;

    const cap = Math.max(1, Math.min(MAX_SELECTED_FACTORS, Number(maxSelect) || MAX_SELECTED_FACTORS));
    if (list.length === 1) {
        return {
            factors: [list[0]],
            indices: [0],
            rationale: "Only one mechanism candidate was returned.",
        };
    }

    const userPrompt = JSON.stringify({
        hypothesis: hypothesisText || "",
        target: targetResolvedId || targetText || null,
        outcome: outcomeResolvedId || outcomeText || null,
        max_select: cap,
        min_select: 1,
        candidates: list.map((f, index) => ({
            index,
            label: f.label || null,
            factor: f.factor || null,
            cfde_disease: f.cfdeDisease || null,
            score: f.score != null ? f.score : null,
        })),
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
            onError: (error) => reject(error || new Error("Mechanism factor selection failed")),
        });
    });

    const rawIndices = Array.isArray(raw && raw.indices)
        ? raw.indices
        : raw && raw.index != null
          ? [raw.index]
          : [];
    const seen = new Set();
    const indices = [];
    rawIndices.forEach((value) => {
        const index = Number(value);
        if (!Number.isInteger(index) || index < 0 || index >= list.length || seen.has(index)) {
            return;
        }
        seen.add(index);
        indices.push(index);
    });

    if (!indices.length) {
        throw new Error(
            `Mechanism factor selection returned no valid indices: ${JSON.stringify(raw && raw.indices)}`
        );
    }

    const limited = indices.slice(0, cap);
    return {
        factors: limited.map((index) => list[index]),
        indices: limited,
        rationale:
            String((raw && raw.rationale) || "").trim() ||
            "Selected by LLM as the most relevant mechanism match(es).",
    };
}
