import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import kp4cd from "@/modules/kp4cd";
import bioIndex from "@/modules/bioIndex";
import keyParams from "@/utils/keyParams";
import bioIndexUtils from "@/utils/bioIndexUtils";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
        pigeanPhenotype: bioIndex("pigean-gene-phenotype"),
        genesetPhenotype: bioIndex("pigean-gene-set-phenotype"),
    },
    state: {
        // phenotypes needs to be an array so colors don't change!
        phenotype: null,
        newPhenotype: null,
        phenotypesInSession: null,
        diseaseInSession: null,
        selectedPhenotype: null,
        manhattanPlotAvailable: false,
        sigma: keyParams.sigma || bioIndexUtils.DEFAULT_SIGMA,
        sigmaToQuery: null,
        genesetSize: keyParams.genesetSize || bioIndexUtils.DEFAULT_GENESET_SIZE,
        genesetSizeToQuery: null, 
    },
    mutations: {
        setSigma(state, sigma){
            state.sigma = sigma || state.sigma
            keyParams.set({ sigma: state.sigma });
        },
        setGenesetSize(state, genesetSize){
            state.genesetSize = genesetSize || state.genesetSize;
            keyParams.set({ genesetSize: state.genesetSize });
        },
        setPhenotypesInSession(state, PHENOTYPES) {
            state.phenotypesInSession = PHENOTYPES;
        },
        setDiseaseInSession(state, DISEASE) {
            state.diseaseInSession = DISEASE;
        },
        setSelectedPhenotype(state, PHENOTYPE) {
            state.selectedPhenotype = PHENOTYPE;
            keyParams.set({ phenotype: PHENOTYPE.name });
        },
    },
    getters: {
        documentationMap(state) {
            return {
                phenotype: state.phenotype.description,
            };
        },
    },
    actions: {
        onPhenotypeChange(context, phenotype) {
            console.log(phenotype);
            context.state.selectedPhenotype = phenotype;
            keyParams.set({ phenotype: phenotype.name });
        },

        queryPhenotype(context) {
            context.state.phenotype = context.state.selectedPhenotype;
            let name = context.state.phenotype.name;
            let sigma = context.state.sigmaToQuery || context.state.sigma;
            let genesetSize = context.state.genesetSizeToQuery || context.state.genesetSize;
            context.commit("setSigma", sigma);
            context.commit("setGenesetSize", genesetSize);
            
            let sigmaInt = parseInt(sigma.slice(-1));
            let query = { q: `${name},${sigmaInt},${genesetSize}`, limit: 1000 };
            context.dispatch("pigeanPhenotype/query", query);
            context.dispatch("genesetPhenotype/query", query);
        },
        phenotypesInSession(context, PHENOTYPES) {
            context.commit("setPhenotypesInSession", PHENOTYPES);
        },
        diseaseInSession(context, DISEASE) {
            context.commit("setDiseaseInSession", DISEASE);
        },
        selectedPhenotype(context, PHENOTYPE) {
            console.log("onState", PHENOTYPE);
            context.commit("setSelectedPhenotype", PHENOTYPE);
        },
    },
});
