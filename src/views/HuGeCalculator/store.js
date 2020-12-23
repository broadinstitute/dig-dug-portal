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
        genes: bioIndex("genes"),
        associations: bioIndex("associations"),
        geneAssociations52k: bioIndex("gene-associations-52k"),
    },
    state: {
        associationsData: {},
        variants: [],
        regionData: {},

    },
    mutations: {
        setAssociationsData(state, associationsData) {
            state.associationsData = associationsData
        },
        setRegionData(state, regionData) {
            state.regionData = regionData
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
                    end: gene.end,
                }
            }
        },
    },
    actions: {
        // async queryGeneRegion(context, region) {
        //     let { chromosome, start, end } = region || context.getters.region;
        //     let q = `${chromosome}:${start}-${end}`;
        //     context.dispatch('genes/query', { q });
        // },

        async getRegion(context, gene) {
            context.dispatch('gene/query', { q: gene });
            
        },
        async getEGLData(context, phen) {
            let dataset = "mccarthy";
            let trait = "t2d";
            context.dispatch("kp4cd/getEglData", { dataset, trait });
        },

        async get52KAssociationData(context, gene) {
            context.dispatch('geneAssociations52k/query', { q: gene });
        }
    }
});
