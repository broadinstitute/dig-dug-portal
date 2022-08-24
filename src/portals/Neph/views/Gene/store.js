import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import bioIndex from "@/modules/bioIndex";
import kp4cd from "@/modules/kp4cd";
import keyParams from "@/utils/keyParams";
import uniprot from "@/modules/uniprot";
import regionUtils from "@/utils/regionUtils";
import { contourDensity } from "d3-contour";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
        gene: bioIndex("gene"),
        genes: bioIndex("genes"),
        geneassociations: bioIndex("gene-associations"),
        varassociations: bioIndex("associations"),
        associations52k: bioIndex("gene-associations-52k",{query_private:true}),
        uniprot        
    },
    state: {
        geneName: keyParams.gene,
        aliasName: null,
        prior: 0.3696,
        HPOTerms: {
            "HP-0000119": "Abnormality of the genitourinary system",
            "HP-0000152": "Abnormality of head or neck",
            "HP-0000478": "Abnormality of the eye",
            "HP-0000598": "Abnormality of the ear",
            "HP-0000707": "Abnormality of the nervous system",
            "HP-0000769": "Abnormality of the breast",
            "HP-0000818": "Abnormality of the endocrine system",
            "HP-0001197": "Abnormality of prenatal development or birth",
            "HP-0001507": "Growth abnormality",
            "HP-0001574": "Abnormality of the integument",
            "HP-0001608": "Abnormality of the voice",
            "HP-0001626": "Abnormality of the cardiovascular system",
            "HP-0001871": "Abnormality of blood and blood-forming tissues",
            "HP-0001939": "Abnormality of metabolism/homeostasis",
            "HP-0002086": "Abnormality of the respiratory system",
            "HP-0002664": "Neoplasm",
            "HP-0002715": "Abnormality of the immune system",
            "HP-0025031": "Abnormality of the digestive system",
            "HP-0025142": "Constitutional symptom",
            "HP-0025354": "Abnormal cellular phenotype",
            "HP-0033127": "Abnormality of the musculoskeletal system",
            "HP-0040064": "Abnormality of limbs",
            "HP-0045027": "Abnormality of the thoracic cavity",
            "AllControl": "Controls",
        }
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

        canonicalSymbol(state) {
            //console.log("canonical Symbol:"+JSON.stringify(state.genes)+"|"+JSON.stringify(state.gene));
            let data = state.genes.data;
            let geneData = state.gene.data;

            if (data.length > 0){
                for (let i in data) {
                    if (data[i].source === "symbol") {
                        return data[i].name;
                    }
                }
            } else {
                return null;
            }
            
        },

        geneSymbol(state) {
            let data = state.genes.data;
            let geneData = state.gene.data[0];
            //console.log("data:", data);
            //console.log("geneData:", geneData);
            for (let i in data) {
                if (data[i].chromosome == geneData.chromosome && data[i].start == geneData.start && data[i].end == geneData.end) {
                    if (data[i].source === "symbol") {
                        return data[i].name;
                    }
                }
            }
        }
    },

    actions: {
        async queryGeneName(context, symbol) {
            let name = symbol || context.state.geneName;
            this.state.geneName = name;
            //alert(symbol+"|"+context.state.geneName+"|"+this.state.geneName)
            
            context.commit("setGeneName", name);
            if (!!name) {
                context.dispatch("gene/query", { q: name });
            }
        },

        async queryGeneRegion(context, region) {
            //alert("query gene:"+JSON.stringify(region) +"|"+JSON.stringify(context.getters.region));
            //alert("gene name:"+this.state.geneName);
            if(region != null || context.getters.region != null) {
                //alert("query gene:"+JSON.stringify(region) +"|"+JSON.stringify(context.getters.region));
                let { chromosome, start, end } = region || context.getters.region;
                let q = `${chromosome}:${start}-${end}`;
    
                context.dispatch("genes/query", { q });
                //alert("query gene region:"+JSON.stringify(region)+"|"+this.state.geneName);
            }
        },

        async queryUniprot(context, symbol) {
            //alert("query uniprot:"+symbol);
            let name = symbol || context.getters.canonicalSymbol;
            if (!!symbol) {
                context.dispatch("uniprot/getUniprotGeneInfo", name);
                
            }
            //alert("query call:"+JSON.stringify(this.state.uniprot));
        },

        async queryAssociations(context) {
            //let query = { q: context.state.geneName,query_private:true };
            let query = { q: context.state.geneName,query_private:true };
            context.dispatch("associations52k/query", query);
            let query2 = { q: context.state.geneName};
            context.dispatch("geneassociations/query", query2);
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
            context.dispatch("associations52k/query", { q: name, query_private:true });
        }
    }
});
