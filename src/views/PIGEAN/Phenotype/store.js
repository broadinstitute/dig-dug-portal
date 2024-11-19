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
        pigeanFactor: bioIndex("pigean-factor"),
        pigeanPheWAS: bioIndex("pigean-phewas"),
        pigeanTopPhewas: bioIndex("pigean-top-phewas"),
        pigeanAllPhenotypes: bioIndex("pigean-phenotypes"),
    },
    state: {
        // phenotypes needs to be an array so colors don't change!
        phenotype: null,
        newPhenotype: null,
        phenotypesInSession: null,
        diseaseInSession: null,
        selectedPhenotype: null,
        manhattanPlotAvailable: false,
        genesetSize: keyParams.genesetSize || bioIndexUtils.DEFAULT_GENESET_SIZE,
        genesetSizeToQuery: null,
        traitGroup: keyParams.traitGroup || bioIndexUtils.DEFAULT_TRAIT_GROUP,
        traitGroupToQuery: null,
    },
    mutations: {
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
        setTraitGroup(state, traitGroup){
            state.traitGroup = traitGroup || state.traitGroup;
            keyParams.set({ traitGroup: state.traitGroup });
        },
    },
    getters: {
        docDetails(state) {
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
            let genesetSize = context.state.genesetSizeToQuery || context.state.genesetSize;
            let traitGroup = context.state.traitGroupToQuery || context.state.traitGroup;
            context.commit("setGenesetSize", genesetSize);
            context.commit("setTraitGroup", traitGroup);
            
            let query = { q: `${name},${bioIndexUtils.DEFAULT_SIGMA},${genesetSize}`, limit: 1000 };
            context.dispatch("pigeanPhenotype/query", query);
            context.dispatch("genesetPhenotype/query", query);
            context.dispatch("pigeanFactor/query", query);
            context.dispatch("pigeanTopPhewas/query", query);
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
        async getPigeanPhenotypes(context) {
            await context.dispatch("pigeanAllPhenotypes/query", {q:1});
            console.log(JSON.stringify(context.state.pigeanAllPhenotypes.data));
        },
    },
});
