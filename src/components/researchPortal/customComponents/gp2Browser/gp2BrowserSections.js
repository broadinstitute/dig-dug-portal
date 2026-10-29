import {
    drawerTabLabel,
    drawerTabHeight,
    drawerRailMinHeight,
    sectionHasCanvasTrack,
} from "../kpVariantSifter/variantSifterSections.js";

/** Section registry for GP2 Browser workspace (visualizer & drawer stack order). */
export const GP2_BROWSER_SECTIONS = [
    {
        id: "associations",
        label: "Associations",
        drawerLabel: "Asso.",
        shortLabel: "Asso.",
        description: "Association and LD plots for the searched locus.",
    },
    {
        id: "qtl-evidences",
        label: "QTL evidences",
        drawerLabel: "QTL evidences",
        shortLabel: "QTL",
        description: "QTL associations for the 50 kb viewing region.",
        trackImplemented: false,
    },
    {
        id: "credible-sets",
        label: "Credible sets",
        drawerLabel: "Cred. sets",
        shortLabel: "CS",
        description: "Fine-mapped credible set membership filters.",
        trackImplemented: true,
    },
    {
        id: "global-enrichment",
        label: "Global enrichment",
        drawerLabel: "Global enrich.",
        shortLabel: "Enrich.",
        description: "Regulatory annotation enrichment across broad tissue categories.",
        trackImplemented: false,
    },
    {
        id: "variant-to-gene-links",
        label: "Gene links",
        drawerLabel: "Gene links",
        shortLabel: "V2G",
        description: "Tissue-specific variant-to-gene linking evidence.",
        trackImplemented: false,
    },
    {
        id: "snp2gene-links",
        label: "SNP 2 gene links",
        drawerLabel: "SNP-to-gene",
        shortLabel: "S2G",
        description: "SNP-to-gene link scores for the locus.",
        trackImplemented: false,
    },
    {
        id: "genes",
        label: "Genes",
        drawerLabel: "Genes",
        shortLabel: "Genes",
        description: "Gene annotation track filters for the searched locus.",
        trackImplemented: false,
    },
];

export const GP2_DEFAULT_VISIBLE_SECTION_IDS = [
    "associations",
    "qtl-evidences",
    "genes",
];

/** Curated phenotype options for GP2 Browser (dropdown select). */
export const GP2_BROWSER_PHENOTYPES = [
    {
        name: "Parkinsons",
        description: "Parkinsons",
    },
];

/** BioIndex host serving GP2 associations. */
export const GP2_ASSOCIATIONS_BIOINDEX_HOST =
    "https://gp2-dev.hugeampkpnbi.org";

export function gp2DefaultVisibleSectionIds(sections = GP2_BROWSER_SECTIONS) {
    const allowed = new Set((sections || []).map((section) => section.id));
    const defaults = GP2_DEFAULT_VISIBLE_SECTION_IDS.filter((id) =>
        allowed.has(id)
    );
    return defaults.length
        ? defaults
        : (sections || []).map((section) => section.id);
}

export function gp2NormalizeVisibleSectionIds(
    ids,
    sections = GP2_BROWSER_SECTIONS
) {
    const allowed = new Set((sections || []).map((section) => section.id));
    if (!Array.isArray(ids)) {
        return gp2DefaultVisibleSectionIds(sections);
    }
    const next = [...new Set(ids.filter((id) => allowed.has(id)))];
    return next.length ? next : gp2DefaultVisibleSectionIds(sections);
}

export function gp2SectionById(sectionId, sections = GP2_BROWSER_SECTIONS) {
    return (
        (sections || []).find((s) => s.id === sectionId) ||
        GP2_BROWSER_SECTIONS.find((s) => s.id === sectionId) ||
        null
    );
}

export {
    drawerTabLabel,
    drawerTabHeight,
    drawerRailMinHeight,
    sectionHasCanvasTrack,
};
