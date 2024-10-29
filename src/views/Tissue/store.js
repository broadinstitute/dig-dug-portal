import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import bioIndex from "@/modules/bioIndex";
import kp4cd from "@/modules/kp4cd";
import keyParams from "@/utils/keyParams";
import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";
import { query } from "@/utils/bioIndexUtils";

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
    },
    state: {
        tissueName: keyParams.tissue || "",
        selectedTissue: "",
        geneExpressionTissue: [],
        selectedAncestry: "",
        selectedPhenotype: null,
        topPhenotype: null,
        credibleSetPhenotype: null,
        annotationOptions: [],
        selectedAnnotation: "",
    },

    mutations: {
        setTissueName(state, tissueName) {
            state.tissueName = tissueName || state.tissueName;
            keyParams.set({ tissue: state.tissueName });
        },
        setTopPhenotype(state, phenotype) {
            state.topPhenotype = phenotype || state.topPhenotype;
            state.credibleSetPhenotype = phenotype;
        },
    },
    actions: {
        getTissue(context) {
            context.state.tissueName = context.state.selectedTissue || context.state.tissueName;
            context.dispatch("tissue/query", {
                q: context.state.tissueName.replaceAll(" ", "_"), limit: 1000
            });
            let name = context.state.tissueName;
            // TODO FIX BIOINDICES
            if (name === 'adipose_tissue'){
                name = 'adipose';
            }
            context.dispatch("mouseSummary/query", {q: name});
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
        getCs2ct(context, phenotype, ancestry){
            let queryString = `${context.state.selectedAnnotation},${context.state.tissueName}`;
            if (!!ancestry){
                queryString = `${ancestry},${queryString}`;
            }
            queryString = `${phenotype},${queryString}`;
            console.log(queryString);
            context.dispatch("cs2ct/query", { q : queryString });
        },
        onPhenotypeChange(context, phenotype){
            context.state.selectedPhenotype = phenotype;
            context.state.credibleSetPhenotype = phenotype.name;

            // Credible set is based on top phenotype or user selected phenotype,
            // whichever is changed most recently.
            context.dispatch("getCs2ct", phenotype.name);
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
            console.log(annotations);
            context.state.annotationOptions = annotations;
            context.state.selectedAnnotation = annotations[0];
		},
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
