// This file centralizes static Liger view configuration so the main view can
// focus on user interactions instead of carrying large embedded data objects.

export const ligerDefaults = {
    dataset: "scRNA",
    cellType: "Delta",
    model: "mouse_msigdb",
    factor: "Factor4"
};

export const ligerApiConfig = {
    baseUrl: "https://private.hugeampkpnbi.org/api/bio",
    datasetMetadataUrl: "https://bioindex-dev.pankbase.org/api/raw/file/single_cell_all_metadata/dataset_metadata.json.gz",
    queryEndpoints: {
        factors: "pankbase-scb-factor",
        factorGenes: "pankbase-scb-gene-factor",
        factorTraits: "pankbase-scb-trait-factor",
        factorGeneSets: "pankbase-scb-gene-set-factor",
        factorCells: "pankbase-scb-cell-factor",
        graphEdges: "pankbase-scb-graph-all-edges"
    },
    matchEndpoints: {
        graphEdges: "pankbase-scb-graph-all-edges"
    }
};

export function createLigerApiCache() {
    return {
        datasetMetadata: null,
        factors: {},
        factorGenes: {},
        factorTraits: {},
        factorGeneSets: {},
        factorCells: {},
        graphTraitMatches: {},
        graphGeneMatches: {},
        graphTraitResults: {},
        graphGeneResults: {}
    };
}
