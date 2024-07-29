import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import bioIndex from "@/modules/bioIndex";
import kp4cd from "@/modules/kp4cd";
import keyParams from "@/utils/keyParams";
import uniprot from "@/modules/uniprot";
import regionUtils from "@/utils/regionUtils";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
        gene: bioIndex("gene"),
        genes: bioIndex("genes"),
        geneassociations: bioIndex("gene-associations"),
        varassociations: bioIndex("associations"),
        associations52k: bioIndex("gene-associations-52k"),
        uniprot,
    },
    state: {
        geneName: keyParams.gene,
        aliasName: null,
        prior: 0.3696,
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
            let data = state.genes.data;
            let geneData = state.gene.data;

            for (let i in data) {
                if (data[i].source === "symbol") {
                    return data[i].name;
                }
            }
        },

        geneSymbol(state) {
            let data = state.genes.data;
            let geneData = state.gene.data;
            if (data.length === 0 || geneData.length === 0) {
                return;
            }
            for (let i in data) {
                if (
                    data[i].chromosome == geneData[0].chromosome &&
                    data[i].start == geneData[0].start &&
                    data[i].end == geneData[0].end
                ) {
                    if (data[i].source === "symbol") {
                        return data[i].name;
                    }
                }
            }
        },
    },

    actions: {
        async queryGeneName(context, symbol) {
            let name = symbol || context.state.geneName;
            context.commit("setGeneName", name);

            if (!!name) {
                context.dispatch("gene/query", { q: name });
            }
        },

        async queryGeneRegion(context, region) {
            let { chromosome, start, end } = region || context.getters.region;
            let q = `${chromosome}:${start}-${end}`;

            context.dispatch("genes/query", { q });
        },

        async queryUniprot(context, symbol) {
            let name = symbol || context.getters.canonicalSymbol;

            if (!!symbol) {
                context.dispatch("uniprot/getUniprotGeneInfo", name);
            }
        },

        async queryAssociations(context) {
            let query = { q: context.state.geneName };
            context.dispatch("associations52k/query", query);
            context.dispatch("geneassociations/query", query);
        },
        async getVarAssociationsData(context, phenotype) {
            let gene = context.state.geneName;
            // let phenotype = phenoGeneInput["phenotype"];
            let locus = await regionUtils.parseRegion(gene, true, 50000);

            if (locus) {
                context.state.newChr = locus.chr;
                context.state.newStart = locus.start;
                context.state.newEnd = locus.end;
            }

            const phenoRegionQuery = `${phenotype},${locus.chr}:${locus.start}-${locus.end}`;
            context.dispatch("varassociations/query", { q: phenoRegionQuery });
        },
        async getEGLData(context) {
            let dataset = "mccarthy";
            let trait = "t2d";
            context.dispatch("kp4cd/getEglData", { dataset, trait });
        },
        async get52KAssociationData(context) {
            let name = context.state.geneName;
            context.dispatch("associations52k/query", { q: name });
        },
    },
});
