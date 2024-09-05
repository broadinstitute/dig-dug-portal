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
        diffExp: bioIndex("diff-exp"),
    },
    state: {
        diffExpTissue: keyParams.tissue || "",
        diffExpGene: keyParams.gene || "",
        selectedTissue: "",
        selectedGene: "",
        tissueKeys: [],
        geneKeys: []
    },

    mutations: {
        setTissueName(state, tissueName) {
            state.diffExpTissue = tissueName || state.diffExpTissue;
            keyParams.set({ tissue: state.diffExpTissue });
        },
        setGeneName(state, geneName) {
            state.diffExpGene = geneName || state.diffExpGene;
            keyParams.set({ gene: state.diffExpGene });
        }
    },
    actions: {
        async getEvidence(context, { q }) {
            let evidence = await context.dispatch("geneExpression/query", {
                q,
            });
            return evidence;
        },
        async getTissueSummary(context){
            let name = context.state.diffExpTissue;
            // TODO FIX BIOINDICES
            if (name === 'adipose_tissue'){
                name = 'adipose';
            }
            context.dispatch("mouseSummary/query", {q: name});
        },
        async getTissueKeys(context) {
			let tissues = await fetch(`${BIO_INDEX_HOST}/api/bio/keys/diff-exp/2?columns=tissue`)
				.then(resp => resp.json())
				.then(json => {
					if (json.count == 0) {
						return null;
					}
					return json.keys.map(key => key[0])
				});
            context.state.tissueKeys = tissues;
		},
        async getGeneKeys(context){
            let genes = await fetch(`${BIO_INDEX_HOST}/api/bio/keys/diff-exp/2?columns=gene`)
                .then(resp => resp.json())
                .then(json => {
                    if (json.count == 0) {
                        return null;
                    }
                    return json.keys.map(key => key[0])
                });
            context.state.geneKeys = genes;
        },
        onTissueChange(context, tissue){
            tissue = tissue.replaceAll(" ", "_");
            context.state.selectedTissue = tissue;
            keyParams.set({ tissue: tissue });
        }
    },
});
