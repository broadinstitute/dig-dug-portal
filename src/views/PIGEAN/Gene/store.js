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
    },
    state: {
        geneName: keyParams.gene,
        sigma: keyParams.sigma || bioIndexUtils.DEFAULT_SIGMA,
        genesetSize: keyParams.genesetSize || bioIndexUtils.DEFAULT_GENESET_SIZE,
        geneToQuery: "",
        sigmaToQuery: null,
        genesetSizeToQuery: null,
        aliasName: null,
    },

    mutations: {
        setGeneName(state, geneName) {
            state.geneName = geneName || state.geneName;
            keyParams.set({ gene: state.geneName });
        },
        setSigma(state, sigma){
            state.sigma = sigma || state.sigma;
            keyParams.set({ sigma: state.sigma });
        },
        setGenesetSize(state, genesetSize){
            state.genesetSize = genesetSize || state.genesetSize;
            keyParams.set({ genesetSize: state.genesetSize });
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
            let sigma = context.state.sigmaToQuery || context.state.sigma;
            let genesetSize = context.state.genesetSizeToQuery || context.state.genesetSize;
            context.commit("setGeneName", name);
            context.commit("setSigma", sigma);
            context.commit("setGenesetSize", genesetSize);

            let sigmaInt = parseInt(sigma.slice(-1));
            if (!!name) {
                context.dispatch("gene/query", { q: name });
                context.dispatch("pigeanGene/query", { q: 
                    `${name},${sigmaInt},${genesetSize}` });
            }
        },
    },
});
