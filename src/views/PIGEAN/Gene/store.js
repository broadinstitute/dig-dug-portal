import Vue from "vue";
import Vuex from "vuex";
import bioPortal from "@/modules/bioPortal";
import bioIndex from "@/modules/bioIndex";
import kp4cd from "@/modules/kp4cd";
import keyParams from "@/utils/keyParams";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
        gene: bioIndex("gene"),
        pigeanGene: bioIndex("pigean-gene"),
    },
    state: {
        geneName: keyParams.gene,
        geneToQuery: "",
        aliasName: null,
    },

    mutations: {
        setGeneName(state, geneName) {
            state.geneName = geneName || state.geneName;
            keyParams.set({ gene: state.geneName });
        },
        setGene(state, { name, chromosome, start, end }) {
            state.geneName = name;
            state.geneRegion = `${chromosome}:${start}-${end}`;
        },
        setAliasName(state, aliasName) {
            state.aliasName = aliasName || state.aliasName;
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
                };
            }
        },
        canonicalSymbol(state) {
            let data = state.gene.data;
            if (data.length > 0) {
                return data[0].symbol;
            }
            return null;
        },
    },

    actions: {
        async queryGeneName(context, symbol) {
            let name = context.state.geneToQuery || context.state.geneName;
            context.commit("setGeneName", name);

            if (!!name) {
                context.dispatch("gene/query", { q: name });
                context.dispatch("pigeanGene/query", { q: name });
            }
        },
    },
});
