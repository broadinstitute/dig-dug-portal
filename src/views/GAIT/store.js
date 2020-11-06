import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import kp4cd from "@/modules/kp4cd";
import bioIndex from "@/modules/bioIndex";
import ldServer from "@/modules/ldServer";
import keyParams from "@/utils/keyParams";
import { query } from "@/utils/bioIndexUtils";
import { uniqBy } from "lodash";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
        ldServer,
        gene: bioIndex("gene"),
        genes: bioIndex("gene-finder")
        //burden: bioIndex("burden")
    },
    state: {
        // phenotypes needs to be an array so colors don't change!
        searchGene: "slc30a8", //!static for test
        //binID: "bin1_7" //!can move to data prop later
        binID: ["bin1_7"],
        variants: []
    },
    mutations: {
        setPhenotype(state, phenotype) {
            state.phenotype = phenotype;
        },
        setVariants(state, data) {
            state.variants = data;
        }
    },
    getters: {
        region(state) {
            let data = state.gene.data;

            if (data.length > 0) {
                let gene = data[0];

                return {
                    chromosome: gene.chromosome,
                    start: gene.start,
                    end: gene.end
                };
            }
        }
    },
    actions: {
        onPhenotypeChange(context, phenotype) {
            context.commit("setPhenotype", phenotype);
            keyParams.set({ phenotype: phenotype.name });
        },

        queryPhenotype(context) {
            let query = { q: context.state.phenotype.name };
            //let assocQuery = { ...query, limit: 1000 };
            let geneQuery = { ...query, limit: 500 };

            //context.dispatch("associations/query", assocQuery);
            //context.dispatch("annotations/query", query);
            context.dispatch("genes/query", geneQuery);
        },

        async queryBurden(context) {
            let gene = context.state.searchGene;
            let binID = context.state.binID;

            // let q = `${gene},${binID}`;

            // //TODO: set url params for bookmark
            // context.dispatch("burden/query", { q });
            let queries = binID.map(bin => query("burden", `${gene},${bin}`));
            let data = await Promise.all(queries)
                .then(results => results.flatMap(data => data))
                .then(data => uniqBy(data, "varId"));

            //let unique = uniqBy(data, "varId");

            context.commit("setVariants", data);
            //console.log("data", unique);
        }
    }
});
