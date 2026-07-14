import { KP_ANCESTRY_LD_POPULATIONS, resolveLdPopulation } from "./variantSifterLdServer.js";

export const VARIANT_SIFTER_PLOT_MARGIN = {
    leftMargin: 150,
    rightMargin: 80,
    topMargin: 50,
    bottomMargin: 100,
    bump: 11,
};

/** Compact margin for the credible-sets track nested in the associations stack. */
export const VARIANT_SIFTER_CS_TRACK_MARGIN = {
    leftMargin: 150,
    rightMargin: 80,
    topMargin: 28,
    bottomMargin: 100,
    bump: 11,
};

/** Margin for annotation tissue tracks in the main workspace stack. */
export const VARIANT_SIFTER_ANNO_TRACK_MARGIN = {
    leftMargin: 150,
    rightMargin: 80,
    topMargin: 28,
    bottomMargin: 100,
    bump: 11,
};

export const VARIANT_SIFTER_PLOT_COLORS = [
    "#007bff",
    "#048845",
    "#8490C8",
    "#BF61A5",
    "#EE3124",
    "#FF6600",
    "#FFC005",
    "#996600",
];

export function buildAssociationsRegionPlotConfig(searchSession) {
    const ldPopulation = resolveLdPopulation(searchSession?.ancestry);

    return {
        "x axis field": "Position",
        "y axis field": "-log10(P-Value)",
        "render by": "Variant ID",
        "y axis label": "-log10(p-value)",
        "x axis label": "",
        "hover content": ["P-Value", "Beta", "Z Score"],
        height: 120,
        "star key": null,
        "genome reference": "GRCh37",
        "ld server": {
            pos: "Position",
            ref: "ref",
            alt: "alt",
            "ref variant field": "Variant ID",
            "populations type": "fixed",
            "fixed population": ldPopulation,
            populations: KP_ANCESTRY_LD_POPULATIONS,
        },
    };
}
