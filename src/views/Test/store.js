import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import bioIndex from "@/modules/bioIndex";
import kp4cd from "@/modules/kp4cd";
import keyParams from "@/utils/keyParams";
import uniprot from "@/modules/uniprot";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
        //genes: bioIndex("genes"),
        gene: bioIndex("gene"),
        //genes: bioIndex("genes"),
        variants: bioIndex("variant-phenotype", {query_private:true}),
        //genes: bioIndex("genes", {query_private:true}),
        //genes: bioIndex("genes"),
        uniprot
    },
    state: {
        geneName: keyParams.gene
    },

    mutations: {
        setGeneName(state, geneName) {
            state.geneName = geneName || state.geneName;
            keyParams.set({ gene: state.geneName });
        },
        setGene(state, { name, chromosome, start, end }) {
            state.geneName = name;
            state.geneRegion = `${chromosome}:${start}-${end}`;
            //keyParams.set({ geneRegion: state.geneRegion });
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
        },

        /*canonicalSymbol(state) {
            let data = state.genes.data;

            for (let i in data) {
                if (data[i].source === "symbol") {
                    return data[i].name;
                }
            }
        }*/
    },

    actions: {
        async queryGeneName(context, symbol) {
            let name = symbol || context.state.geneName;
            context.commit("setGeneName", name);
            //console.log("start query gene");
            if (!!name) {
                context.dispatch("gene/query", { q: name });
            }
            
        },

        async queryGeneRegion(context, region) {
            console.log("query gene region");
            let { chromosome, start, end } = region || context.getters.region;
            //let q = `${chromosome}:${start}-${end}`;
            let name = context.state.geneName;
            context.commit("setGene", {name, chromosome, start, end});
            let q = context.state.geneRegion;
            console.log(q);
            //context.dispatch("genes/query", { q });
            context.dispatch("variants/query", { q });
            //console.log(context.state.gene)
            //console.log(context.state.genes)
        },

        /*async queryUniprot(context, symbol) {
            let name = symbol || context.getters.canonicalSymbol;

            if (!!symbol) {
                context.dispatch("uniprot/getUniprotGeneInfo", name);
            }
        },

        async queryAssociations(context) {
            let query = { q: context.state.geneName };
            context.dispatch("associations52k/query", query);
            context.dispatch("associations/query", query);
        },
        async queryGenes(context) {
            console.log(context.state.gene);
            let region = context.state.gene.data[0];
            console.log(region)
            let chromosome=region.chromosome;
            let start=region.start;
            let end = region.end;
            
            context.commit("setGene", {name, chromosome, start, end});
            let q = context.state.geneRegion;
            console.log(q)
            console.log("start query genes");
            context.dispatch("genes/query", { q });
            console.log(context.state.genes);
        }*/
    }
});
