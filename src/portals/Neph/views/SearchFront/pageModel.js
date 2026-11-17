/**
 * Page model for the SearchFront page.
 * Manages search modes, input parsing, validation, and routing.
 */

export const SEARCH_MODES = {
    SAMPLE: {
        id: "sample",
        label: "Sample ID Search",
        placeholder: "Enter Sample ID (e.g., S001, S002, S003)",
        description: "Search for a specific patient/sample in the CRDC cohort to inspect phenotypic and genotypic characteristics.",
        examples: ["S001", "S002", "S003"]
    },
    PHENOTYPE: {
        id: "phenotype",
        label: "HPO Phenotype Search",
        placeholder: "Enter HPO terms separated by semicolons (e.g., HP:0001263; HP:0000175)",
        description: "Search the CRDC cohort and reference databases using a custom HPO phenotype profile.",
        examples: ["HP:0001263;HP:0000175", "HP:0001250", "HP:0000707;HP:0001250"]
    },
    VARIANT_GENE: {
        id: "variant_gene",
        label: "Variant or Gene Search",
        placeholder: "Enter Gene Symbol (e.g., COL4A3) or Variant ID (e.g., 13:32315474:A:G)",
        description: "Look up a variant or gene to view cohort carriers, demographic distributions, and pathogenicity scores.",
        examples: ["COL4A3", "13:32315474:A:G", "13:32315474:A:G", "COL4A4"]
    }
};

/**
 * Validates and parses the search query based on the active mode.
 * Returns the destination URL if valid, or throws an error.
 */
export function getTargetRoute(mode, query) {
    if (!query || !query.trim()) {
        throw new Error("Please enter a search query.");
    }

    const trimmedQuery = query.trim();

    switch (mode) {
        case "sample":
            // Patient page matches patient.html in vue.config.Neph.js
            return `./patient.html?sample_id=${encodeURIComponent(trimmedQuery)}`;

        case "phenotype": {
            // Validate HPO format (comma/semicolon separated HP:XXXXXXX or HP.XXXXXXX)
            const hpoRegex = /^(HP[:.]\d+)([\s,;]+HP[:.]\d+)*$/i;
            const normalized = trimmedQuery.replace(/[\s,;]+/g, ";").toUpperCase();
            if (!hpoRegex.test(normalized)) {
                throw new Error("Phenotype query must be a list of HPO IDs (e.g. HP:0001263; HP:0000175).");
            }
            return `./phenotype.html?query=${encodeURIComponent(normalized)}`;
        }

        case "variant_gene":
            // Check if it looks like a variant (e.g. chr:pos:ref:alt) or gene
            if (trimmedQuery.includes(":") || /^[0-9xyXY]+-\d+-[a-zA-Z]+-[a-zA-Z]+$/.test(trimmedQuery)) {
                // Variant view in Neph portal matches variant.html
                return `./variant.html?variant=${encodeURIComponent(trimmedQuery)}`;
            } else {
                // Gene view in Neph portal matches gene.html
                return `./gene.html?gene=${encodeURIComponent(trimmedQuery.toUpperCase())}`;
            }

        default:
            throw new Error("Invalid search mode selected.");
    }
}

/**
 * Format active context status label based on current HPO terms.
 */
export function getContextStatusLabel(hpos) {
    if (!hpos || hpos.length === 0) {
        return "No context active";
    }
    return `${hpos.length} HPO term(s) active in clinical context`;
}
