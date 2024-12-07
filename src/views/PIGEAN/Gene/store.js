import Vue from "vue";
import Vuex from "vuex";
import bioPortal from "@/modules/bioPortal";
import bioIndex from "@/modules/bioIndex";
import kp4cd from "@/modules/kp4cd";
import keyParams from "@/utils/keyParams";
import bioIndexUtils from "@/utils/bioIndexUtils";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
        gene: bioIndex("gene"),
        pigeanGene: bioIndex("pigean-gene"),
        pigeanAllPhenotypes: bioIndex("pigean-phenotypes"),
    },
    state: {
        geneName: keyParams.gene,
        genesetSize: keyParams.genesetSize || bioIndexUtils.DEFAULT_GENESET_SIZE,
        geneToQuery: "",
        genesetSizeToQuery: null,
        aliasName: null,
        traitGroup: keyParams.traitGroup || bioIndexUtils.DEFAULT_TRAIT_GROUP,
        traitGroupToQuery: null,

    },

    mutations: {
        setGeneName(state, geneName) {
            state.geneName = geneName || state.geneName;
            keyParams.set({ gene: state.geneName });
        },
        setGenesetSize(state, genesetSize){
            state.genesetSize = genesetSize || state.genesetSize;
            keyParams.set({ genesetSize: state.genesetSize });
        },
        setTraitGroup(state, traitGroup){
            state.traitGroup = traitGroup || state.traitGroup;
            keyParams.set({ traitGroup: state.traitGroup });
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
            let genesetSize = context.state.genesetSizeToQuery || context.state.genesetSize;
            let traitGroup = context.state.traitGroupToQuery || context.state.traitGroup;
            context.commit("setGeneName", name);
            context.commit("setGenesetSize", genesetSize);
            context.commit("setTraitGroup", traitGroup);
            if (!!name) {
                context.dispatch("gene/query", { q: name });
                context.dispatch("pigeanGene/query", { q: 
                    `${traitGroup},${name},${bioIndexUtils.DEFAULT_SIGMA},${genesetSize}`,
                    limit: 1000 });
            }
        },
        async getPigeanPhenotypes(context) {
            await context.dispatch("pigeanAllPhenotypes/query", {q:1});
        },
    },
});
