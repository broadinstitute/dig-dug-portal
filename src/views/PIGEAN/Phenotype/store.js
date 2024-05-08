import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import kp4cd from "@/modules/kp4cd";
import bioIndex from "@/modules/bioIndex";
import keyParams from "@/utils/keyParams";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
        associations: bioIndex("global-associations"),
        annotations: bioIndex("global-enrichment"),
        genes: bioIndex("gene-finder"),
        genes52k: bioIndex("gene-finder-52k"),
        hugePhenotype: bioIndex("huge-phenotype"),
        ancestryGlobalAssoc: bioIndex("ancestry-global-associations"),
        geneticCorrelation: bioIndex("genetic-correlation"),
        pathwayAssoc: bioIndex("pathway-associations"),
        c2ct: bioIndex("c2ct"),
    },
    state: {
        // phenotypes needs to be an array so colors don't change!
        phenotype: null,
        newPhenotype: null,
        phenotypesInSession: null,
        diseaseInSession: null,
        phenotypeCorrelation: null,
        selectedPhenotype: null,
        ancestry: !!keyParams.ancestry ? keyParams.ancestry : "",
        selectedAncestry: !!keyParams.ancestry ? keyParams.ancestry : "",
        manhattanPlotAvailable: true,
    },
    mutations: {
        setPhenotype(state, phenotype) {
            state.phenotype = phenotype;
        },
        setPhenotypesInSession(state, PHENOTYPES) {
            state.phenotypesInSession = PHENOTYPES;
        },
        setDiseaseInSession(state, DISEASE) {
            state.diseaseInSession = DISEASE;
        },
        setPhenotypeCorrelation(state, Correlation) {
            state.phenotypeCorrelation = Correlation;
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
                ancestry: state.ancestry,
            };
        },
    },
    actions: {
        onPhenotypeChange(context, phenotype) {
            context.state.selectedPhenotype = phenotype;
            keyParams.set({ phenotype: phenotype.name });
        },

        queryPhenotype(context) {
            context.state.ancestry = context.state.selectedAncestry;
            context.state.phenotype = context.state.selectedPhenotype;
            let query = { q: context.state.phenotype.name };
            let assocQuery = { ...query, limit: 1000 };
            let ancestryQuery = {
                q: `${context.state.phenotype.name},${context.state.ancestry}`,
            };
            let ancestryAssocQuery = { ...ancestryQuery, limit: 1000 };
            let ancestryOptionalQuery = !context.state.ancestry
                ? query
                : ancestryQuery;
            let geneQuery = {
                ...ancestryOptionalQuery,
                limitWhile: (r) => r.pValue <= 0.05,
                limit: 1000,
            };
            let gene52kQuery = {
                ...query,
                limitWhile: (r) => r.pValue <= 0.05,
                limit: 1000,
            };
            let hugePhenotypeQuery = { ...query, limit: 1000 };
            let pathwayAssocQuery = { ...ancestryOptionalQuery, limit: 100 };

            if (
                context.state.ancestry == "" ||
                context.state.ancestry == null
            ) {
                context.dispatch("associations/query", assocQuery);
            } else {
                context.dispatch(
                    "ancestryGlobalAssoc/query",
                    ancestryAssocQuery
                );
            }
            context.dispatch("annotations/query", query);
            context.dispatch("genes/query", geneQuery);
            context.dispatch("genes52k/query", gene52kQuery);
            context.dispatch("hugePhenotype/query", hugePhenotypeQuery);
            context.dispatch("geneticCorrelation/query", ancestryOptionalQuery);
            context.dispatch("pathwayAssoc/query", pathwayAssocQuery);
            context.dispatch("c2ct/query", ancestryOptionalQuery);
            context.state.manhattanPlotAvailable = true;
        },
        phenotypesInSession(context, PHENOTYPES) {
            context.commit("setPhenotypesInSession", PHENOTYPES);
        },
        diseaseInSession(context, DISEASE) {
            context.commit("setDiseaseInSession", DISEASE);
        },
        phenotypeCorrelation(context, DATA) {
            context.commit("setPhenotypeCorrelation", DATA);
        },

        selectedPhenotype(context, PHENOTYPE) {
            console.log("onState", PHENOTYPE);
            context.commit("setSelectedPhenotype", PHENOTYPE);
        },
    },
});
