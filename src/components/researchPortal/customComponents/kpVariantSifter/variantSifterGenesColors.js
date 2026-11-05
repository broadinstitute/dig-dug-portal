import { resolveGeneType } from "./variantSifterGenesFilter.js";

/** Stable colors for common Ensembl biotypes in the genes track. */
export const VKS_GENE_TYPE_COLORS = {
    protein_coding: "#2c5c97",
    lncRNA: "#824099",
    miRNA: "#d03633",
    misc_RNA: "#6b6b6b",
    snRNA: "#4db052",
    snoRNA: "#32afd5",
    rRNA: "#ee982d",
    tRNA: "#2074b6",
    processed_transcript: "#9a6bb3",
    pseudogene: "#a67c52",
    unprocessed_pseudogene: "#a67c52",
    transcribed_unprocessed_pseudogene: "#b8916a",
    transcribed_processed_pseudogene: "#b8916a",
    IG_C_gene: "#c45c8a",
    IG_D_gene: "#c45c8a",
    IG_J_gene: "#c45c8a",
    IG_V_gene: "#c45c8a",
    TR_C_gene: "#3d8f7a",
    TR_D_gene: "#3d8f7a",
    TR_J_gene: "#3d8f7a",
    TR_V_gene: "#3d8f7a",
};

export const VKS_GENE_TYPE_FALLBACK_COLORS = [
    "#5c7cfa",
    "#e8590c",
    "#37b24d",
    "#ae3ec9",
    "#1098ad",
    "#f08c00",
    "#868e96",
];

export const VKS_GENE_UNKNOWN_TYPE_COLOR = "#6b6b6b";

export function buildGeneTypeColorMap(geneTypes = []) {
    const map = {};
    let fallbackIndex = 0;
    const sortedTypes = [...new Set(geneTypes.filter(Boolean))].sort();

    sortedTypes.forEach((geneType) => {
        if (VKS_GENE_TYPE_COLORS[geneType]) {
            map[geneType] = VKS_GENE_TYPE_COLORS[geneType];
            return;
        }
        map[geneType] = VKS_GENE_TYPE_FALLBACK_COLORS[
            fallbackIndex % VKS_GENE_TYPE_FALLBACK_COLORS.length
        ];
        fallbackIndex += 1;
    });

    return map;
}

export function geneColorForType(geneType, colorByGeneType) {
    if (geneType && colorByGeneType?.[geneType]) {
        return colorByGeneType[geneType];
    }
    return VKS_GENE_UNKNOWN_TYPE_COLOR;
}

export function geneColorForGene(gene, colorByGeneType) {
    return geneColorForType(resolveGeneType(gene), colorByGeneType);
}
