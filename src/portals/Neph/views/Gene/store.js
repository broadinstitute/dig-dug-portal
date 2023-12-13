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
        gene: bioIndex("gene",{query_private:true}),
        genes: bioIndex("genes",{query_private:true}),
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
            "HP-0000009":"Functional abnormality of the bladder",
                "HP-0000020":"Urinary incontinence",
                "HP-0000079":"Abnormality of the urinary system",
                "HP-0000095":"Abnormal renal glomerulus morphology",
                "HP-0000118":"Phenotypic abnormality",
                "HP-0000119":"Abnormality of the genitourinary system",
                "HP-0000152":"Abnormality of head or neck",
                "HP-0000359":"Abnormality of the inner ear",
                "HP-0000407":"Sensorineural hearing impairment",
                "HP-0000478":"Abnormality of the eye",
                "HP-0000486":"Strabismus",
                "HP-0000598":"Abnormality of the ear",
                "HP-0000707":"Abnormality of the nervous system",
                "HP-0000709":"Psychosis",
                "HP-0000716":"Depressivity",
                "HP-0000717":"Autism",
                "HP-0000725":"Psychotic episodes",
                "HP-0000738":"Hallucinations",
                "HP-0000769":"Abnormality of the breast",
                "HP-0000787":"Nephrolithiasis",
                "HP-0000795":"Abnormality of the urethra",
                "HP-0000818":"Abnormality of the endocrine system",
                "HP-0000826":"Precocious puberty",
                "HP-0001197":"Abnormality of prenatal development or birth",
                "HP-0001388":"Joint laxity",
                "HP-0001507":"Growth abnormality",
                "HP-0001574":"Abnormality of the integument",
                "HP-0001608":"Abnormality of the voice",
                "HP-0001622":"Premature birth",
                "HP-0001626":"Abnormality of the cardiovascular system",
                "HP-0001679":"Abnormal aortic morphology",
                "HP-0001699":"Sudden death",
                "HP-0001871":"Abnormality of blood and blood-forming tissues",
                "HP-0001877":"Abnormal erythrocyte morphology",
                "HP-0001903":"Anemia",
                "HP-0001939":"Abnormality of metabolism/homeostasis",
                "HP-0001945":"Fever",
                "HP-0002028":"Chronic diarrhea",
                "HP-0002032":"Esophageal atresia",
                "HP-0002086":"Abnormality of the respiratory system",
                "HP-0002088":"Abnormal lung morphology",
                "HP-0002110":"Bronchiectasis",
                "HP-0002186":"Apraxia",
                "HP-0002197":"Generalized-onset seizure",
                "HP-0002533":"Abnormal posturing",
                "HP-0002589":"Gastrointestinal atresia",
                "HP-0002664":"Neoplasm",
                "HP-0002715":"Abnormality of the immune system",
                "HP-0002836":"Bladder exstrophy",
                "HP-0003011":"Abnormality of the musculature",
                "HP-0004322":"Short stature",
                "HP-0004386":"Gastrointestinal inflammation",
                "HP-0005341":"Autonomic bladder dysfunction",
                "HP-0005528":"Bone marrow hypocellularity",
                "HP-0007018":"Attention deficit hyperactivity disorder",
                "HP-0008373":"Puberty and gonadal disorders",
                "HP-0008443":"Spinal deformities",
                "HP-0009826":"Limb undergrowth",
                "HP-0011035":"Abnormal renal cortex morphology",
                "HP-0012639":"Abnormal nervous system morphology",
                "HP-0020110":"Bone fracture",
                "HP-0025031":"Abnormality of the digestive system",
                "HP-0025142":"Constitutional symptom",
                "HP-0025354":"Abnormal cellular phenotype",
                "HP-0031263":"Abnormal renal corpuscle morphology",
                "HP-0033127":"Abnormality of the musculoskeletal system",
                "HP-0040064":"Abnormality of limbs",
                "HP-0040069":"Abnormal lower limb bone morphology",
                "HP-0045027":"Abnormality of the thoracic cavity",
                "HP-0100021":"Cerebral palsy",
                "HP-0100280":"Crohn's disease",
                "HP-0100820":"Glomerulopathy",
                "HP-0200134":"Epileptic encephalopathy",
				"isControl": "Controls",
                "isUnknown": "Unknown phenotype",
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
            let geneData = state.gene.data[0];
            //console.log("canonical geneData:", geneData);
            if (data.length > 0){
                for (let i in data) {
                    if (data[i].source === "symbols") {
                        return data[i].name;
                    }
                }
            } else {
                //temper change
                if(geneData != null){
                    return geneData.name;
                }else{
                    return null;
                }
                //return null;
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
                //console.log("query gene region:"+JSON.stringify(region)+"|"+this.state.geneName);
            }
        },

        async queryUniprot(context, symbol) {
            
            let name = symbol || context.getters.canonicalSymbol;
            //console.log("query uniprot:"+name);
            if (!!symbol) {
                context.dispatch("uniprot/getUniprotGeneInfo", name);
                
            }
            //console.log("query call:"+JSON.stringify(this.state.uniprot));
        },

        async queryAssociations(context) {
            //alert("here");
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
