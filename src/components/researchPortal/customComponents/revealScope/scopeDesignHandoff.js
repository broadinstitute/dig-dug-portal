/**
 * "Design experiment protocol" — composes a URL to REVEAL DESIGN (`cfdeScope2Design.vue`)
 * carrying the evaluated hypothesis's components, and opens it in a new tab.
 *
 * DESIGN's page is CMS-managed under pageid `cfde_scope2design` (confirmed with the user
 * directly rather than guessed — that pageid->component mapping lives outside this repo).
 * The canonical/production URL shape for any CMS page is `/r/<pageid>?<query>`; `kcURL()`
 * (the same helper `cfdeDesign.vue` itself uses for its own outbound links, e.g. to
 * CFDE-EXPLORE) rewrites that to `/research.html?pageid=<pageid>&<query>` on localhost only
 * — on a deployed server it passes the `/r/...` path through unchanged. Do not hardcode the
 * `/research.html?pageid=` form here; it would break on any remote deployment.
 */
import { kcURL } from "@/utils/cfdeUtils";

export const DESIGN_PAGE_PATH = "/r/cfde_scope2design";

/** Matches ScopeEvaluationPanel.vue's own modifier id -> display label mapping exactly. */
const MODIFIER_LABELS = {
    cell_line: "Cell line",
    genetic_background: "Genetic background",
    dose_timepoint: "Dose / timepoint",
    tissue: "Tissue",
    comparator: "Comparator",
};

function slotLine(label, value) {
    const text = String(value || "").trim();
    if (!text) return "";
    return `${label}: ${text}`;
}

/**
 * Builds the "Experiment Constraints" free-text block from every evaluated slot except
 * target (which goes to DESIGN's Genes field separately) — one labeled line per non-empty
 * slot, so a downstream LLM (or a human) can tell "what to measure" (Outcome) apart from
 * pure logistics (Cell line/Dose/Tissue/Comparator) rather than reading one unlabeled blob.
 */
export function buildDesignConstraintsText(evaluation) {
    if (!evaluation || !evaluation.slots) return "";
    const slots = evaluation.slots;
    const lines = [
        slotLine("Perturbation", slots.perturbation && slots.perturbation.value),
        slotLine("Outcome", slots.outcome && slots.outcome.value),
    ];
    const modifiers = slots.modifiers || {};
    Object.keys(MODIFIER_LABELS).forEach((id) => {
        const modifier = modifiers[id];
        lines.push(slotLine(MODIFIER_LABELS[id], modifier && modifier.value));
    });
    return lines.filter(Boolean).join("\n");
}

/**
 * @param {{ hypothesisText: string, evaluation: object }} params
 * @returns {string} environment-appropriate URL (kcURL-resolved), ready for window.open
 */
export function buildDesignHandoffUrl({ hypothesisText, evaluation }) {
    const target = evaluation && evaluation.slots && evaluation.slots.target;
    const genes = (target && (target.resolvedId || target.value)) || "";
    const constraints = buildDesignConstraintsText(evaluation);

    const params = new URLSearchParams();
    if (hypothesisText) params.set("hypothesis", hypothesisText);
    if (genes) params.set("genes", genes);
    if (constraints) params.set("constraints", constraints);

    return kcURL(`${DESIGN_PAGE_PATH}?${params.toString()}`);
}
