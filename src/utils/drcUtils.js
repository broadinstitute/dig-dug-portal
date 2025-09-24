async function create_pwb_workflow(props) {
    const req = await fetch('https://playbook-workflow-builder.cloud/api/db/fpl', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify(props.body),
    })
    const res = await req.json()
    return `https://playbook-workflow-builder.cloud/${props.mode ?? 'report'}/${res}`
}

async function create_pwb_gene_set_workflow(gene_set, description) {
    return await create_pwb_workflow({
        body: {
            "data": {
                "gene-set": {
                    "type": "Input[Set[Gene]]",
                    "value": {
                        "description": description,
                        "set": gene_set,
                    }
                }
            },
            "workflow": [
                { "id": "input-gene-set", "type": "Input[Set[Gene]]", "data": { "id": "gene-set" } },
                { "id": "enrichment-results", "type": "CFDEGSEGenesetSearch", "inputs": { "geneset": { "id": "input-gene-set" } } },
                { "id": "gtex.0", "type": "ExtractCFDEGSEGenesetSearch[GTEx_Tissues_V8_2023]", "inputs": { "searchResults": { "id": "enrichment-results" } } },
                { "id": "gtex.1", "type": "EnrichrScoredTToScoredT[Tissue]", "inputs": { "enrichrscored": { "id": "gtex.0" } } },
                { "id": "gtex.2", "type": "BarChartFrom[Scored[Tissue]]", "inputs": { "terms": { "id": "gtex.1" } } },
                { "id": "lincs.0", "type": "ExtractCFDEGSEGenesetSearch[LINCS_L1000_Chem_Pert_Consensus_Sigs]", "inputs": { "searchResults": { "id": "enrichment-results" } } },
                { "id": "lincs.1", "type": "EnrichrScoredTToScoredT[Drug]", "inputs": { "enrichrscored": { "id": "lincs.0" } } },
                { "id": "lincs.2", "type": "BarChartFrom[Scored[Drug]]", "inputs": { "terms": { "id": "lincs.1" } } },
                { "id": "idg.0", "type": "ExtractCFDEGSEGenesetSearch[IDG_Drug_Targets_2022]", "inputs": { "searchResults": { "id": "enrichment-results" } } },
                { "id": "idg.1", "type": "EnrichrScoredTToScoredT[Drug]", "inputs": { "enrichrscored": { "id": "idg.0" } } },
                { "id": "idg.2", "type": "BarChartFrom[Scored[Drug]]", "inputs": { "terms": { "id": "idg.1" } } },
                { "id": "hubmap.0", "type": "ExtractCFDEGSEGenesetSearch[HuBMAP_ASCTplusB_augmented_2022]", "inputs": { "searchResults": { "id": "enrichment-results" } } },
                { "id": "hubmap.1", "type": "EnrichrScoredTToScoredT[Tissue]", "inputs": { "enrichrscored": { "id": "hubmap.0" } } },
                { "id": "hubmap.2", "type": "BarChartFrom[Scored[Tissue]]", "inputs": { "terms": { "id": "hubmap.1" } } },
                { "id": "glygen.0", "type": "ExtractCFDEGSEGenesetSearch[GlyGen_Glycosylated_Proteins_2022]", "inputs": { "searchResults": { "id": "enrichment-results" } } },
                { "id": "glygen.1", "type": "EnrichrScoredTToScoredT[glycan]", "inputs": { "enrichrscored": { "id": "glygen.0" } } },
                { "id": "glygen.2", "type": "BarChartFrom[Scored[glycan]]", "inputs": { "terms": { "id": "glygen.1" } } },
                { "id": "metabolomics.0", "type": "ExtractCFDEGSEGenesetSearch[Metabolomics_Workbench_Metabolites_2022]", "inputs": { "searchResults": { "id": "enrichment-results" } } },
                { "id": "metabolomics.1", "type": "EnrichrScoredTToScoredT[Metabolite]", "inputs": { "enrichrscored": { "id": "metabolomics.0" } } },
                { "id": "metabolomics.2", "type": "BarChartFrom[Scored[Metabolite]]", "inputs": { "terms": { "id": "metabolomics.1" } } },
                { "id": "motrpac.0", "type": "ExtractCFDEGSEGenesetSearch[MoTrPAC_2023]", "inputs": { "searchResults": { "id": "enrichment-results" } } },
                { "id": "motrpac.1", "type": "EnrichrScoredTToScoredT[Tissue]", "inputs": { "enrichrscored": { "id": "motrpac.0" } } },
                { "id": "motrpac.2", "type": "BarChartFrom[Scored[Tissue]]", "inputs": { "terms": { "id": "motrpac.1" } } },
            ],
            "metadata": { "title": "CFDE Gene Set Enrichment" }
        },
    })
}

async function getGenesInGeneSet(QUERY, DATA_POINT, MODEL) {

    console.log(QUERY, DATA_POINT, MODEL);

    let url = DATA_POINT.url + QUERY;
    let contentJson = await fetch(url).then((resp) => resp.json());

    if (contentJson.error == null && !!Array.isArray(contentJson.data) && contentJson.data.length > 0) {
        let genes = (MODEL == 'all') ? contentJson.data.map((gene) => gene.gene) : contentJson.data.filter((gene) => gene.gene_set_size == MODEL).map((gene) => gene.gene);
        return genes;
    } else {
        return null;
    }

}

export default { create_pwb_workflow, create_pwb_gene_set_workflow, getGenesInGeneSet };