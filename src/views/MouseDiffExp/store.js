import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import bioIndex from "@/modules/bioIndex";
import kp4cd from "@/modules/kp4cd";
import keyParams from "@/utils/keyParams";
import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
        diffExp: bioIndex("diff-exp"),
        tissueSummary: bioIndex("diff-exp-summary-tissue"),
        geneSummary: bioIndex("diff-exp-summary-gene"),
        hugeScores: bioIndex("huge"),
        geneassociations: bioIndex("gene-associations"),
        varassociations: bioIndex("associations"),
        associations52k: bioIndex("gene-associations-52k"),
        geneToTranscript: bioIndex("gene-to-transcript"),
        transcriptAssoc: bioIndex("transcript-associations"),
    },
    state: {
        tissue: keyParams.tissue || "",
        gene: keyParams.gene || "",
        tissueKeys: [],
        tissueToQuery: "",
        geneToQuery: "",
    },

    mutations: {
        setTissueName(state, tissueName) {
            state.tissue = tissueName || state.tissue;
            keyParams.set({ tissue: state.tissue });
        },
        setGeneName(state, geneName) {
            state.gene = geneName || state.gene;
            keyParams.set({ gene: state.gene });
        },
        setCommonVariantsLength(state, NUM) {
            state.commonVariantsLength = NUM;
        },
    },
    actions: {
        commonVariantsLength(context, NUM) {
            context.commit("setCommonVariantsLength", NUM);
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
        async selectGeneName(context, geneName){
            console.log(geneName);
            context.state.geneToQuery = geneName;
        },
        async queryDiffExp(context) {
            let gene = context.state.geneToQuery || context.state.gene;
            context.commit("setGeneName", gene);

            let tissue = context.state.tissueToQuery || context.state.tissue;
            context.commit("setTissueName", tissue);

            if (!!tissue){
                context.dispatch("tissueSummary/query", {q: tissue});
            }
            if (!!gene){
                let query = { q: gene};
                context.dispatch("geneSummary/query", query);
                context.dispatch("hugeScores/query", query);
                context.dispatch("associations52k/query", query);
                context.dispatch("geneassociations/query", query);
            }
            if (!!gene && !!tissue) {
                context.dispatch("diffExp/query", { q: 
                    `${gene},${tissue}` });
            }
        },
    },
});
