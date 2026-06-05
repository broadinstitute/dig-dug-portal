/** Edge provenance helpers (Playground EdgeProvenancePanel parity). */

import { formatInspectorValue } from "./revealKgInspectorUtils.js";

export const EDGE_SCORE_HELP = {
    geneTrait:
        "Gene-trait raw scores are PIGEAN log Bayes factors. The UI converts them with prior 0.05 to show the probability that the gene is relevant to the trait.",
    geneMechanism:
        "Gene-mechanism scores are EAGGL loadings: probability-like values that the gene participates in the mechanism.",
    traitMechanism:
        "Trait-mechanism scores are anchor-specific mechanism relevance values. EAGGL computes them by projecting anchor relevance probabilities onto mechanism loadings with non-negative least squares when the trait is run as an anchor.",
    mechanismTrait:
        "Mechanism-trait scores come from EAGGL phenotype projection. PIGEAN PheWAS summaries are projected onto the learned mechanism basis, so the score is phenotype capture rather than necessarily direct causal relevance.",
    mechanismGeneSet:
        "Mechanism/gene-set scores are EAGGL loadings: probability-like values that the gene set interrogates the mechanism.",
    aggregate:
        "For expansion, raw edge evidence is normalized within edge family. Aggregate applies the selected reducer across the anchor set; Max and Mean summarize the unnormalized support across supporting anchor paths.",
    normalizedScore:
        "Raw edge support transformed within its edge family by subtracting that family's mean and dividing by its standard deviation.",
};

export function scoreHelpForFamily(family = "") {
    const normalizedFamily = String(family).toLowerCase();
    if (normalizedFamily.includes("trait_gene") || normalizedFamily.includes("gene_trait")) {
        return EDGE_SCORE_HELP.geneTrait;
    }
    if (normalizedFamily.includes("gene_factor") || normalizedFamily.includes("factor_gene")) {
        return EDGE_SCORE_HELP.geneMechanism;
    }
    if (normalizedFamily.includes("trait_factor") || normalizedFamily.includes("factor_trait")) {
        return EDGE_SCORE_HELP.traitMechanism;
    }
    if (normalizedFamily.includes("trait_mechanism")) {
        return EDGE_SCORE_HELP.mechanismTrait;
    }
    if (normalizedFamily.includes("gene_set_factor") || normalizedFamily.includes("factor_gene_set")) {
        return EDGE_SCORE_HELP.mechanismGeneSet;
    }
    return `${EDGE_SCORE_HELP.aggregate} ${EDGE_SCORE_HELP.geneTrait} ${EDGE_SCORE_HELP.geneMechanism} ${EDGE_SCORE_HELP.traitMechanism} ${EDGE_SCORE_HELP.mechanismTrait}`;
}

export function inferLocusZoomPayload(payload) {
    if (payload?.locus_zoom) {
        return payload.locus_zoom;
    }
    const source = String(payload?.edge?.source || "");
    const target = String(payload?.edge?.target || "");
    const geneId = source.startsWith("gene:")
        ? source
        : target.startsWith("gene:")
          ? target
          : "";
    const traitId = source.startsWith("trait:")
        ? source
        : target.startsWith("trait:")
          ? target
          : "";
    if (!geneId || !traitId) {
        return null;
    }
    const trait = traitId.replace("trait:", "");
    return {
        gene: geneId.replace("gene:", ""),
        trait_id: trait,
        trait_label: trait,
        flank: 250000,
    };
}

export function formatEdgeProvenancePValue(value) {
    if (value === null || value === undefined || value === "") {
        return "NA";
    }
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        return String(value);
    }
    if (numeric === 0) {
        return "0";
    }
    if (Math.abs(numeric) < 0.001 || Math.abs(numeric) >= 1000) {
        return numeric.toExponential(2);
    }
    return numeric.toPrecision(3);
}

export function formatEdgeProvenanceProbability(value) {
    if (value === null || value === undefined || value === "") {
        return "NA";
    }
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        return String(value);
    }
    return numeric.toFixed(3);
}

export function formatEdgeProvenanceValue(value, digits = 3) {
    return formatInspectorValue(value, digits);
}

export function geneSetRowToAddPayload(row) {
    if (!row?.gene_set) {
        return null;
    }
    return {
        node_id: `gene_set:${row.gene_set}`,
        node_type: "gene_set",
        type: "gene_set",
        label: row.gene_set,
        subtitle: row.library || "Gene set",
    };
}
