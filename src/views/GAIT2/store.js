import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import kp4cd from "@/modules/kp4cd";
import hugeampkpncms from "@/modules/hugeampkpncms";
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
        hugeampkpncms,
        ldServer,
        gene: bioIndex("gene"),
        associations: bioIndex("associations"),
    },
    state: {
        variants: [],
        pkgData: {},
        pkgDataSelected: [],
        genesInRegion: null,
        codingGenesData: null,
    },
    mutations: {
        setPhenotype(state, phenotype) {
            state.phenotypes = phenotype;
        },
        setVariants(state, data) {
            state.variants = data;
        },
        setPkgData(state, data) {
            state.pkgData = data;
        },
        setPkgDataSelected(state, data) {
            if (data.action == "add") {
                var tempObject = { type: null, id: null };
                tempObject.type = data.type;
                tempObject.id = data.id;
                state.pkgDataSelected.push(tempObject);
            }

            if (data.action == "remove") {
                let tempArray = [];
                state.pkgDataSelected.map(p => {
                    if (p.type != data.type || p.id != data.id) {
                        tempArray.push(p);
                    }
                });
                state.pkgDataSelected = tempArray;
            }
        },
        setGenesInRegion(state, data) {

            state.genesInRegion = data;
        },
        setCodingGenesData(state, data) {
            console.log("dk", data);
            state.codingGenesData = data;
        },
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
        onPhenotypeChange(context, phenotypes) {
            context.commit("setPhenotype", phenotypes);
        },

        async queryGenes(context, phenotypes) {
            let queries = phenotypes.map(phenotype =>
                query("gene-finder", phenotype)
            );

            let data = await Promise.all(queries)
                .then(results => results.flatMap(data => data))
                .then(data => uniqBy(data, "gene"));

            context.commit("setGenes", data);
        },

        async queryBurden(context, { gene, binID }) {
            let queries = binID.map(bin => query("burden", `${gene},${bin}`));
            let data = await Promise.all(queries)
                .then(results => results.flatMap(data => data))
                .then(data => uniqBy(data, "varId"));
            context.commit("setVariants", data);
        },
        pkgData(context, pkgData) {
            context.commit("setPkgData", pkgData);
        },
        pkgDataSelected(context, data) {
            context.commit("setPkgDataSelected", data);
        },
        genesInRegion(context, genes) {
            context.commit("setGenesInRegion", genes);
        },
        codingGenesData(context, setCodingGenesData) {
            context.commit("setCodingGenesData", setCodingGenesData);
        },
    }
});
