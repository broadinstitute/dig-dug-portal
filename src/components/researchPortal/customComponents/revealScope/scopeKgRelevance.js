import { createLLMClient } from "@/utils/llmClient";

/**
 * Post-retrieval relevance triage for Module C v0. Adapted from the "Hub Gravity
 * Hijack" / "Site of Action Constraint" pattern in hybridSearchReveal.vue's
 * mechanismHypothesisSystemPrompt — same two-axis problem (mechanism relevance vs.
 * tissue/context relevance are separate questions), reframed as a labeling pass
 * rather than a rejection pass: labels annotate edges, they never delete them
 * (bounded honesty — same "unscored" philosophy as Module A, never silently drop
 * evidence).
 */
const SYSTEM_PROMPT =
    "You classify knowledge-graph evidence edges for relevance to a biological hypothesis.\n" +
    "The knowledge graph (CFDE REVEAL KG) is a statistically-inferred gene<->trait association " +
    "graph — edges reflect real statistical associations, not curated causal claims, and often " +
    "come from a different disease/tissue context than the hypothesis under test.\n\n" +
    "For each edge, decide whether it is:\n" +
    '- "on_topic": both the biological mechanism (gene/factor/gene-set theme) AND the ' +
    "disease/tissue/anatomical context plausibly match the hypothesis's actual system.\n" +
    '- "same_domain_mismatched_context": the mechanism/entity (gene, factor theme, or gene-set ' +
    "name) is genuinely relevant to the hypothesis's biology, but the specific trait/disease/tissue " +
    "context attached to THIS edge belongs to a different anatomical site or disease domain than " +
    "the hypothesis describes (e.g. a hepatocyte hypothesis returns a cardiomyopathy-linked edge " +
    "for the same gene, or a gene-set name is on-topic but its paired trait is not).\n" +
    '- "unrelated": neither the mechanism nor the context has a plausible connection to the ' +
    'hypothesis — likely a "hub" effect, where a highly-connected node surfaced spuriously.\n\n' +
    "Rules:\n" +
    "1. Judge the gene/factor/gene-set NAME's mechanistic theme first, independent of which trait " +
    "it happens to be paired with in this row — a gene set literally named for the hypothesis's " +
    'exact drug/pathway (e.g. "WP_CANCER_IMMUNOTHERAPY_BY_PD_1_BLOCKADE" for a PD-1-blockade ' +
    'hypothesis) is relevant mechanism even if its trait pairing is off-topic; label such rows ' +
    '"same_domain_mismatched_context", not "unrelated".\n' +
    "2. Do not require an exact disease-name match — judge plausibility. A cardiac " +
    "mitochondrial-disease edge for a hepatocyte mitochondrial-function hypothesis is " +
    '"same_domain_mismatched_context" (same organelle/pathway family, different tissue), not ' +
    '"on_topic".\n' +
    "3. If you cannot confidently distinguish between two labels, choose the more conservative " +
    '(lower) one and say why in the rationale — never default to "on_topic".\n' +
    '4. "on_topic" requires the edge\'s trait to match the disease/condition/experimental system ' +
    "the hypothesis itself states — not merely a different disease where the same drug/gene/pathway " +
    'also happens to have some therapeutic or biological relevance. Do not upgrade a trait to ' +
    '"on_topic" by constructing a plausible-sounding indirect rationale (e.g. "this drug is also ' +
    'used for disease X, so X counts") — that reasoning describes a mismatched context, not a match. ' +
    "If the hypothesis names a specific disease/system and the edge's trait is a different disease, " +
    'that is "same_domain_mismatched_context" even if you can imagine a clinical connection.\n' +
    "5. Be internally consistent: if the same factor/gene-set name appears in multiple edges paired " +
    "with different traits, and none of those traits match the hypothesis's stated disease/system, " +
    "label all of those edges the same way — the mechanism judgment is identical across them, so " +
    "only a genuine trait match (not degree of imagined plausibility) may split them into a " +
    "different label.\n" +
    "6. One sentence per rationale. No markdown, no explanation outside the JSON.\n\n" +
    'Respond with strict JSON only: {"classifications": [{"index": number, "label": ' +
    '"on_topic"|"same_domain_mismatched_context"|"unrelated", "rationale": "..."}]}';

const VALID_LABELS = ["on_topic", "same_domain_mismatched_context", "unrelated"];

function edgeDescriptor(route, edge) {
    const base = {
        route: route.id,
        gene: edge.geneLabel || edge.gene || null,
        weight: edge.weight != null ? edge.weight : null,
    };
    if (route.id === "factor") {
        return {
            ...base,
            factor: edge.factorLabel || null,
            trait: edge.traitLabel || edge.cfdeDisease || null,
            geneFactorWeight: edge.geneFactorWeight != null ? edge.geneFactorWeight : null,
        };
    }
    if (route.id === "geneSet") {
        return { ...base, geneSet: edge.geneSetLabel || null, trait: edge.traitLabel || null };
    }
    return { ...base, trait: edge.traitLabel || null };
}

function flattenEdges(routes) {
    const flat = [];
    (routes || []).forEach((route, routeIndex) => {
        (route.edges || []).forEach((edge, edgeIndex) => {
            flat.push({
                index: flat.length,
                routeIndex,
                edgeIndex,
                descriptor: edgeDescriptor(route, edge),
            });
        });
    });
    return flat;
}

/**
 * Classifies every edge across all evidence routes in a single call, once the KG
 * queries have already completed — never per-route, so the model can weigh patterns
 * across the whole result set (e.g. "every route points to the same unrelated
 * disease") and apply one consistent threshold.
 *
 * @returns {Promise<Array<{ routeIndex: number, edgeIndex: number, label: string|null, rationale: string }>>}
 *   Empty array when there is nothing to classify (no edges) — caller should treat
 *   that as "skip", not as a failure.
 */
export async function classifyKgEvidenceRelevance({
    hypothesisText,
    targetText,
    targetResolvedId,
    outcomeText,
    outcomeResolvedId,
    tissue,
    cellLine,
    routes,
} = {}) {
    const flat = flattenEdges(routes);
    if (!flat.length) {
        return [];
    }

    const userPrompt = JSON.stringify({
        hypothesis: hypothesisText || "",
        target: targetResolvedId || targetText || null,
        outcome: outcomeResolvedId || outcomeText || null,
        tissue: tissue || null,
        cell_line: cellLine || null,
        edges: flat.map((f) => ({ index: f.index, ...f.descriptor })),
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
            onError: (error) => reject(error || new Error("Relevance classification failed")),
        });
    });

    const parsed = JSON.parse(raw);
    const classifications = Array.isArray(parsed && parsed.classifications) ? parsed.classifications : [];

    return flat.map((f) => {
        const match = classifications.find((c) => Number(c && c.index) === f.index);
        const label = match && VALID_LABELS.includes(match.label) ? match.label : null;
        const rationale = match && typeof match.rationale === "string" ? match.rationale.trim() : "";
        return { routeIndex: f.routeIndex, edgeIndex: f.edgeIndex, label, rationale };
    });
}

/** Non-destructively annotates routes' edges with `.relevance = {label, rationale}`. Edges with no match are left untouched. */
export function mergeRelevanceIntoRoutes(routes, classifications) {
    if (!classifications || !classifications.length) {
        return routes;
    }
    return routes.map((route, routeIndex) => ({
        ...route,
        edges: route.edges.map((edge, edgeIndex) => {
            const match = classifications.find(
                (c) => c.routeIndex === routeIndex && c.edgeIndex === edgeIndex
            );
            if (!match || !match.label) {
                return edge;
            }
            return { ...edge, relevance: { label: match.label, rationale: match.rationale } };
        }),
    }));
}
