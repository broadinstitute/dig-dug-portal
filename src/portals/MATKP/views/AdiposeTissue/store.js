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
        tissueName: "adipose_tissue", // FIXED
        mouseTissueName: "adipose", // FIXED 
        geneExpressionTissue: [],
        selectedAncestry: "",
        selectedPhenotype: null,
        annotationOptions: [],
        selectedAnnotation: "",
    },

    mutations: {
        setTopPhenotype(state, phenotype) {
            state.topPhenotype = phenotype || state.topPhenotype;
            if (!state.selectedPhenotype){
                console.log("no phenotype here");
                state.selectedPhenotype = phenotype;
            }
        },
        setSelectedAnnotation(state, annotation){
            state.selectedAnnotation = annotation || state.selectedAnnotation;
        }
    },
    actions: {
        getTissue(context) {
            context.dispatch("tissue/query", {
                q: context.state.tissueName.replaceAll(" ", "_"), limit: 1000
            });
            context.dispatch("mouseSummary/query", {q: context.state.mouseTissueName});
        },
        async getEvidence(context, { q }) {
            //Do we neeed this?
            let evidence = await context.dispatch("geneExpression/query", {
                q,
            });
            return evidence;
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
            console.log(annotations);
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
