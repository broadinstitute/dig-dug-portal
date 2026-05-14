// This file centralizes static Liger view configuration so the main view can
// focus on user interactions instead of carrying large embedded data objects.

export const ligerDefaults = {
    dataset: "scRNA",
    cellType: "Delta",
    model: "mouse_msigdb",
    factor: "Factor4"
};

export const ligerDatasetMetadata = {
    "islet_of_Langerhans_scRNA_v3-3": {
        datasetName: "2. Single cell expression map of pancreatic islets using data from HPAP, IIDP and Prodo",
        datasetId: "islet_of_Langerhans_scRNA_v3-3",
        previous_versions: {
            v1: "https://doi.org/10.5281/zenodo.15588240"
        },
        source: "PanKbase",
        species: "Human",
        tissue: "islet of Langerhans",
        depot: "",
        depot2: "",
        method: "scRNAseq",
        platform: "10x genomics",
        summary: "This dataset represents the islet of Langerhans tissue from human samples from HPAP, IIDP and Prodo",
        doi: "https://zenodo.org/records/15596314",
        pmid: "",
        contact: "",
        authors: "Ha T.H. Vu, Han Sun, Seth Sharp, Parul Kudtarkar, Liza Brusman, Julie Jurgens, The PanKbase Consortium, Jason Flannick, Noel Burtt, Shuibing Chen, Jie Liu, Jean-Pilippe Cartailler, Benjamin F. Voight, Michael Lee Stitzel, Marcela Brissova, Anna L. Gloyn, Kyle Gaulton, Stephen C.J. Parker",
        download: "https://pankbase-data-v1.s3.us-west-2.amazonaws.com/analysis_resources/single_cell_objects/060425_scRNA_v3.3.rds",
        genMods: "No modifications",
        otherProperties: [""],
        development_stage__ontology_label: [],
        organism_age__group: [],
        cell_cycle__phase: [],
        disease__ontology_label: ["Diabetes"],
        bmi__group: [],
        library_preparation_protocol__ontology_label: [],
        organ__ontology_label: ["islets"],
        race__ontology_label: [""],
        tissue__ontology_label: ["islet of Langerhans"],
        species__ontology_label: ["Homo sapiens"],
        ethnicity__ontology_label: [""],
        fat__type: [],
        organism_age__unit__ontology_label: [""],
        sex: [""],
        bmi__unit__ontology_label: [""],
        mouse_strain__ontology_label: [],
        diet__schedule: [],
        diet__type: [],
        totalDonors: 140,
        totalCells: 448935
    }
};

export const ligerApiConfig = {
    baseUrl: "https://private.hugeampkpnbi.org/api/bio",
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
