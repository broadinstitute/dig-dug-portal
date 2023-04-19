import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import kp4cd from "@/modules/kp4cd";
import bioIndex from "@/modules/bioIndex";
import keyParams from "@/utils/keyParams";
import { query } from "@/utils/bioIndexUtils";
import dataConvert from "@/utils/dataConvert";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
        geneFinder: bioIndex("gene-finder"),
        hugePhenotype: bioIndex("huge-phenotype"),
    },
    state: {
        newPhenotype: null,
        phenotype: { "name": "T2D", "description": "Type 2 Diabetes" },
        geneFinderAssociations: {},
        phenotypelist: [],
        secondaryPhenotype: null,
        filterbadges: false,
        phenotypesInSession: null,
        diseaseInSession: null,
        phenotypeCorrelation: null,
        eglsFullList: [],
        eglGenes: [],
        //primaryPhCR: {},
        hugeScores: {},
    },
    mutations: {
        setPrimaryPhenotypeData(state, d = {}) {
            let data = d.genefinderData
            let phenotype = d.phenotype
            state.geneFinderAssociations[phenotype] = data;
            state.phenotypelist = [phenotype];
        },
        setSecondaryPhenotypeData(state, d = {}) {
            let data = d.genefinderData
            let phenotype = d.phenotype

            state.geneFinderAssociations[phenotype] = data;
            state.phenotypelist.push(phenotype);
        },

        setPhenotypeGeneFinderAssociations() {
            state.geneFinderAssociations[phenotype] = data;
            state.phenotypelist.push(phenotype);
        },
        setPhenotype(state, phenotype) {
            state.phenotype = phenotype;
        },
        setFilterBadges(state, filterbadges) {
            state.filterbadges = filterbadges;
        },

        setSecondaryPhenotype(state, secondaryPhenotype) {
            //let secondaryPhenotypeList = []
            state.secondaryPhenotype = secondaryPhenotype
        },
        setPhenotypelist(state, phenotypelist) {
            state.phenotypelist = phenotypelist
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

        setEglsFullList(state, list) {
            state.eglsFullList = list;
        },

        setEglGenes(state, GENES) {

            state.eglGenes = GENES;

        },
        setHugeScores(state, huge) {

            state.hugeScores = huge;

        },
        /*setPrimaryPhCR(state, Correlation) {
            state.primaryPhCR = Correlation;
        },*/

    },
    getters: {
        phenotypeGeneFinderData(state) {
            let phenotyped = state.phenotype;
            if (!!state.secondaryPhenotype) {
                phenotyped = state.secondaryPhenotype
            }
            let data = state.geneFinder.data
            let m = {}
            m[phenotyped] = data;
            return m;
        }
    },
    actions: {
        phenotypesInSession(context, PHENOTYPES) {
            context.commit("setPhenotypesInSession", PHENOTYPES);
        },
        diseaseInSession(context, DISEASE) {
            context.commit("setDiseaseInSession", DISEASE);
        },
        phenotypeCorrelation(context, DATA) {
            context.commit("setPhenotypeCorrelation", DATA);
        },
        hugeScores(context, DATA) {
            context.commit("setHugeScores", DATA);

        },

        async queryHugePhenotype(context, phenotype) {
            let query = { q: phenotype }
            context.dispatch("hugePhenotype/query", query);
        },

        async getEglsFullList(context) {
            let dataPoint =
                "https://hugeampkpncms.org/rest/data?pageid=egl_241";

            let contJson = await fetch(dataPoint).then((resp) => resp.json());

            if (contJson.error == null) {
                let data = dataConvert.csv2Json(
                    contJson[0]["field_data_points"]
                );

                context.commit("setEglsFullList", data);
            }
        },

        async getEglGenes(context, PARAMS) {
            let dataPoint =
                "https://hugeampkpncms.org/rest/data?pageid=" + PARAMS.pageId;

            let contJson = await fetch(dataPoint).then((resp) => resp.json());

            if (contJson.error == null) {

                let data = dataConvert.csv2Json(
                    contJson[0]["field_data_points"]
                );

                data.map(d => {
                    d["pageId"] = PARAMS.pageId;
                    d["traitId"] = PARAMS.trait;
                })

                let updatedList = this.state.eglGenes.concat(data);

                context.commit("setEglGenes", updatedList);
            }
        },

        removeEglGenes(context, PARAMS) {

            let updatedGenes = this.state.eglGenes.filter(g => g.pageId != PARAMS.pageId);
            context.commit("setEglGenes", updatedGenes);
        },

        /*
        /// leave it in case we decide to integrate phenotype correlations
        async getPrimaryPhCR(context, primaryPhenotype) {


            let searchPoint =
                "https://bioindex-dev.hugeamp.org/api/bio/query/genetic-correlation?q=" +
                primaryPhenotype;

            var correlationJson = await fetch(searchPoint).then((resp) =>
                resp.json()
            );

            if (correlationJson.error == null) {
                //console.log("correlationJson", correlationJson)
                let CRs = {};

                correlationJson.data.map(p => {
                    CRs[p.other_phnotype] = p;

                })
                context.commit("setPrimaryPhCR", CRs);
            }
        }*/

    }
});
