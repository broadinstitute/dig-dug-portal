/** Shared gene-role colors for FactorBaseReveal network + candidate gene pills (keep in sync visually). */

export const DEFAULT_GENE_NODE_COLOR = "#984ea3";

const GENE_ROLE_COLORS = {
    "Primary Mechanistic Candidate": "#1b7837",
    "Supporting Canonical Network": "#666666",
    "High GWAS": "#d95f02",
    "High Functional": "#7570b3",
    "Genetic (Established)": "#d95f02",
    "Functional (Novel)": "#7570b3",
    Balanced: "#984ea3",
};

/**
 * @param {string|null|undefined} group - `candidate_genes[].group` / mechanism LLM role string
 * @returns {string} hex fill color
 */
export function colorForGeneRole(group) {
    const g = group != null ? String(group).trim() : "";
    if (!g) return DEFAULT_GENE_NODE_COLOR;
    if (Object.prototype.hasOwnProperty.call(GENE_ROLE_COLORS, g)) return GENE_ROLE_COLORS[g];
    if (/primary mechanistic/i.test(g)) return GENE_ROLE_COLORS["Primary Mechanistic Candidate"];
    if (/supporting canonical/i.test(g)) return GENE_ROLE_COLORS["Supporting Canonical Network"];
    return DEFAULT_GENE_NODE_COLOR;
}

/** Sort order for legend: primary, supporting, then alphabetical. */
export function compareGeneRoleLegend(a, b) {
    const rank = (s) => {
        if (/primary mechanistic/i.test(s)) return 0;
        if (/supporting canonical/i.test(s)) return 1;
        return 2;
    };
    const ra = rank(a);
    const rb = rank(b);
    if (ra !== rb) return ra - rb;
    return String(a).localeCompare(String(b));
}
