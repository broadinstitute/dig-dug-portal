/** Section registry for Variant Sifter workspace (visualizer stack order). */
export const VARIANT_SIFTER_SECTIONS = [
    {
        id: "associations",
        label: "Associations",
        drawerLabel: "Associations",
        shortLabel: "Assoc.",
        description: "Association and LD plots for the searched locus.",
    },
    {
        id: "credible-sets",
        label: "Credible sets",
        drawerLabel: "Cred. sets",
        shortLabel: "CS",
        description: "Fine-mapped credible set membership filters.",
        trackImplemented: false,
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
        label: "Variant-to-gene links",
        drawerLabel: "Var-to-gene",
        shortLabel: "V2G",
        description: "Tissue-specific variant-to-gene linking evidence.",
        trackImplemented: false,
    },
    {
        id: "snp2gene-links",
        label: "SNP 2 gene links",
        drawerLabel: "SNP 2 gene",
        shortLabel: "S2G",
        description: "SNP-to-gene link scores for the locus.",
        trackImplemented: false,
    },
];

export function sectionById(sectionId) {
    return VARIANT_SIFTER_SECTIONS.find((s) => s.id === sectionId) || null;
}

export function drawerTabLabel(section, maxLen = 16) {
    const label = section.drawerLabel || section.label;
    if (label.length <= maxLen) {
        return label;
    }
    return `${label.slice(0, maxLen - 1)}…`;
}

const DRAWER_TAB_MIN_HEIGHT = 88;
const DRAWER_TAB_MAX_HEIGHT = 120;
const DRAWER_TAB_GAP = 8;
const DRAWER_TAB_RAIL_PADDING = 24;

export function drawerTabHeight(section) {
    const label = drawerTabLabel(section);
    return Math.min(
        DRAWER_TAB_MAX_HEIGHT,
        Math.max(DRAWER_TAB_MIN_HEIGHT, label.length * 7 + 28)
    );
}

/** Minimum viewport height to show every section puller in the rail. */
export function drawerRailMinHeight(sections) {
    if (!sections || sections.length === 0) {
        return DRAWER_TAB_MIN_HEIGHT + DRAWER_TAB_RAIL_PADDING;
    }

    let total = DRAWER_TAB_RAIL_PADDING;
    sections.forEach((section, index) => {
        total += drawerTabHeight(section);
        if (index < sections.length - 1) {
            total += DRAWER_TAB_GAP;
        }
    });
    return total;
}
