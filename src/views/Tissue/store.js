import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import bioIndex from "@/modules/bioIndex";
import kp4cd from "@/modules/kp4cd";
import keyParams from "@/utils/keyParams";
import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";
import { query } from "@/utils/bioIndexUtils";

const CONNECTIVITY_KEYS = {
    adipose_tissue: ["adipose_subcutaneous", "adipose_visceral"],
    cardiovascular_system: "artery",
    heart: "heart",
    neural_tissue: "hypothalamus",
    kidney: "kidney",
    liver: "liver",
    muscle_tissue: "muscle",
    skeletal_muscle_tissue: "muscle",
    muscle_structure: "muscle",
    pancreas: "pancreas"
}

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
        tissue: bioIndex("gene-expression-tissue"),
        geneExpression: bioIndex("gene-expression"),
        geneLinks: bioIndex("gene-links"),
        mouseSummary: bioIndex("diff-exp-summary-tissue"),
        cs2ct: bioIndex("c2ct-tissue"),
        connectivity: bioIndex("connectivity-map-cp"),
        connectivityCrispr: bioIndex("connectivity-map-crispr"),
    },
    state: {
        tissueName: keyParams.tissue || "",
        selectedTissue: "",
        geneExpressionTissue: [],
        selectedAncestry: "",
        selectedPhenotype: null,
        annotationOptions: [],
        selectedAnnotation: "",
        singleCellDatasets: null,
        connectivityData: [],
        connectivityCrisprData: [],
        connectKeys: [],
        connectCrisprKeys: [],
        comparisons: [],
        crisprComparisons: [],
        adiposeType: CONNECTIVITY_KEYS["adipose_tissue"][0],
        adiposeTypeCrispr: CONNECTIVITY_KEYS["adipose_tissue"][0],
        selectedComparison: "",
        selectedComparisonCrispr: "",
    },

    mutations: {
        setTissueName(state, tissueName) {
            state.tissueName = tissueName || state.tissueName;
            keyParams.set({ tissue: state.tissueName });
        },
        setTopPhenotype(state, phenotype) {
            state.topPhenotype = phenotype || state.topPhenotype;
            if (!state.selectedPhenotype){
                state.selectedPhenotype = phenotype;
            }
        },
        setSelectedAnnotation(state, annotation){
            state.selectedAnnotation = annotation || state.selectedAnnotation;
        },
        setConnectivityData(state, data){
            state.connectivityData = data || state.connectivityData;
        },
        setConnectivityCrisprData(state, data){
            state.connectivityCrisprData = data || state.connectivityCrisprData;
        }
    },
    actions: {
        async getTissue(context) {
            context.state.tissueName = context.state.selectedTissue || context.state.tissueName;
            context.dispatch("tissue/query", {
                q: context.state.tissueName.replaceAll(" ", "_"), limit: 1000
            });
            let name = context.state.tissueName;
            let connectivityKey = CONNECTIVITY_KEYS[name];
            // TODO FIX BIOINDICES
            if (name === 'adipose_tissue'){
                name = 'adipose';
            }
            context.dispatch("mouseSummary/query", {q: name});
            if (!connectivityKey){
                return;
            }
            await context.dispatch("getRelevantComparisons", connectivityKey);
            await context.dispatch("getConnectivityData", connectivityKey);
        },
        async getEvidence(context, { q }) {
            //Do we neeed this?
            let evidence = await context.dispatch("geneExpression/query", {
                q,
            });
            return evidence;
        },
        onTissueChange(context, tissue){
            tissue = tissue.replaceAll(" ", "_");
            context.state.selectedTissue = tissue;
            keyParams.set({ tissue: tissue });
        },
        getCs2ct(context){
            let queryString = `${context.state.selectedAnnotation},${context.state.tissueName}`;
            if (!!context.state.selectedAncestry){
                queryString = `${context.state.selectedAncestry},${queryString}`;
            }
            queryString = `${context.state.selectedPhenotype.name},${queryString}`;
            context.dispatch("cs2ct/query", { q : queryString });
        },
        onPhenotypeChange(context, phenotype){
            context.state.selectedPhenotype = phenotype;
            // Credible set is based on top phenotype or user selected phenotype,
            // whichever is changed most recently.
            context.dispatch("getCs2ct");
        },
        async getAnnotations(context) {
			let annotations = await fetch(`${BIO_INDEX_HOST}/api/bio/keys/c2ct-tissue/3?columns=annotation`)
				.then(resp => resp.json())
				.then(json => {
					if (json.count == 0) {
						return null;
					}
					return json.keys.map(key => key[0])
				});
            context.state.annotationOptions = annotations;
            context.state.selectedAnnotation = annotations[0];
		},
        async getAncestries(context) {
			let ancestries = await fetch(`${BIO_INDEX_HOST}/api/bio/keys/c2ct-tissue/4?columns=ancestry`)
				.then(resp => resp.json())
				.then(json => {
					if (json.count == 0) {
						return null;
					}
					return json.keys.map(key => key[0])
				});
            context.state.ancestryOptions = ancestries;
		},
        async getSingleCellDatasets(context){
            const response = await fetch(`${BIO_INDEX_HOST}/api/raw/file/single_cell_all_metadata/dataset_metadata.json.gz`);
            const text = await response.text();
            const lines = text.split('\n').filter(line => line.trim() !== '');
            let metadata = lines.map(line => JSON.parse(line));
            if (metadata[0]?.data_type) {
                metadata =  metadata.filter(item => item.data_type === 'single_cell');
            }
            context.state.singleCellDatasets = metadata;
        },
        async getConnectKeys(context){
            let allKeys = await fetch(`${BIO_INDEX_HOST}/api/bio/keys/connectivity-map-cp/2`)
				.then(resp => resp.json());
            console.log(JSON.stringify(allKeys));
            context.state.connectKeys = allKeys.keys;
            let allKeys1 = await fetch(`${BIO_INDEX_HOST}/api/bio/keys/connectivity-map-crispr/2`)
				.then(resp => resp.json());
            context.state.connectCrisprKeys = allKeys1.keys;
        },
        async getRelevantComparisons(context, connectivityKey){
            let isString = typeof connectivityKey === "string";
            let key0 = isString ? connectivityKey : connectivityKey[0];
            let comps = context.state.connectKeys.filter(ck => ck[0] === key0);
            comps = Array.from(new Set(comps.map(ck => ck[1])));
            context.state.selectedComparison = comps[0];
            context.state.comparisons = comps;

            let crisprComps = context.state.connectCrisprKeys.filter(ck => ck[0] === key0);
            crisprComps = Array.from(new Set(crisprComps.map(ck => ck[1])));
            context.state.selectedComparisonCrispr = crisprComps[0];
            context.state.crisprComparisons = crisprComps;
        },
        async getConnectivityData(context, connectivityKey){
            console.log("Getting connectivity data");
            let isAdipose = typeof connectivityKey !== "string";
            let queryTissue = isAdipose ? context.state.adiposeType : connectivityKey;
            let queryKey = `${queryTissue},${context.state.selectedComparison}`;
            console.log(queryKey);
            await context.dispatch("connectivity/query", 
                {q: queryKey});
            await context.dispatch("connectivityCrispr/query", 
                {q: `${queryTissue},${context.state.selectedComparisonCrispr}`});
            console.log(JSON.stringify(context.state.connectivity.data));
        }
    },
    getters: {
        tissueData(state) {
            if (state.tissue.data) {
                //return all data where meanTpm > 1
                return state.tissue.data.filter((d) => d.meanTpm >= 1);
            }
            return [];
        },
    },
});
