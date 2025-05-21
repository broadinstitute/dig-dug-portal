import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import kp4cd from "@/modules/kp4cd";
import bioIndex from "@/modules/bioIndex";
import keyParams from "@/utils/keyParams";
import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";

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
        c2ctAnnotation: bioIndex("c2ct-annotation"),
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
        annotationOptions: [],
        selectedAnnotation: "",
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
            keyParams.set({ phenotype: PHENOTYPE.id });
        },
        setSelectedAnnotation(state, annotation){
            state.selectedAnnotation = annotation;
        }
    },
    getters: {
        docDetails(state) {
            return {
                phenotype: state.phenotype.description,
                ancestry: state.ancestry,
            };
        },
    },
    actions: {
        onPhenotypeChange(context, phenotype) {
            console.log("changing phenotype");
            context.state.selectedPhenotype = phenotype;
            console.log(JSON.stringify(context.state.selectedPhenotype));
            keyParams.set({ phenotype: phenotype.id });
        },

        onAncestryChange(context){
            context.dispatch("queryPhenotype");
        },
        async getAnnotations(context) {
			let annotations = await fetch(`${BIO_INDEX_HOST}/api/bio/keys/c2ct-annotation/2?columns=annotation`)
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
        queryPhenotype(context) {
            context.state.ancestry = context.state.selectedAncestry;
            context.state.phenotype = context.state.selectedPhenotype;
            let query = { q: context.state.phenotype.id };
            let assocQuery = { ...query, limit: 1000 };
            let ancestryQuery = {
                q: `${context.state.phenotype.id},${context.state.ancestry}`,
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
            context.dispatch("getCs2ct");
            context.state.manhattanPlotAvailable = true;
        },
        getCs2ct(context){
            let queryString = context.state.phenotype.id;
            if (!!context.state.selectedAncestry){
                queryString = `${context.state.selectedAncestry},${queryString}`;
            }
            queryString = `${queryString},${context.state.selectedAnnotation}`;
            context.dispatch("c2ctAnnotation/query", { q : queryString });
            
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
