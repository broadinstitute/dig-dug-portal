import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import bioIndex from "@/modules/bioIndex";
import kp4cd from "@/modules/kp4cd";
import keyParams from "@/utils/keyParams";
import uniprot from "@/modules/uniprot";
import regionUtils from "@/utils/regionUtils";
import bioIndexUtils from "@/utils/bioIndexUtils";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
        gene: bioIndex("gene"),
        genes: bioIndex("genes"),
        geneassociations: bioIndex("gene-associations"),
        varassociations: bioIndex("associations"),
        ancestryAssoc: bioIndex("ancestry-associations"),
        associations52k_private: bioIndex("gene-associations-52k",{query_private:true}),
        associations52k: bioIndex("gene-associations-52k"),
        geneToTranscript: bioIndex("gene-to-transcript"),
        transcriptAssoc: bioIndex("transcript-associations"),
        hugeScores: bioIndex("huge"),
        geneExpression: bioIndex("gene-expression"),
        pigeanGene: bioIndex("pigean-gene"),
        pigeanAllPhenotypes: bioIndex("pigean-phenotypes"),
        uniprot,
    },
    state: {
        geneName: keyParams.gene,
        geneToQuery: "",
        aliasName: null,
        prior: 0.3696,
        phenotypesInSession: null,
        diseaseInSession: null,
        phenotypeCorrelation: null,
        selectedAncestry: "",
        selectedTranscript: "",
        commonVariantsLength: 0,
        genesetSize: keyParams.genesetSize || bioIndexUtils.DEFAULT_GENESET_SIZE,
        genesetSizeToQuery: null,
        traitGroup: keyParams.traitGroup || bioIndexUtils.DEFAULT_TRAIT_GROUP,
        traitGroupToQuery: null,
        traitsData: [],
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
        },
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
        setPhenotypesInSession(state, PHENOTYPES) {
            state.phenotypesInSession = PHENOTYPES;
        },
        setDiseaseInSession(state, DISEASE) {
            state.diseaseInSession = DISEASE;
        },
        setPhenotypeCorrelation(state, Correlation) {
            state.phenotypeCorrelation = Correlation;
        },
        setCommonVariantsLength(state, NUM) {
            state.commonVariantsLength = NUM;
        },
        setTraitsData(state, traitsData){
            state.traitsData = traitsData;
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
                    end: gene.end,
                };
            }
        },

        // canonicalSymbol(state) {
        //     let data = state.genes.data;
        //     let geneData = state.gene.data;

        //     for (let i in data) {
        //         if (data[i].source === "symbol") {
        //             return data[i].name;
        //         }
        //     }
        // },
        canonicalSymbol(state) {
            let data = state.gene.data;
            if (data.length > 0) {
                return data[0].symbol;
            }
            return null;
        },

        geneSymbol(state) {
            let data = state.genes.data;
            let geneData = state.gene.data;

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
        // For custom phenotypes
        phenotypesInSession(context, PHENOTYPES) {
            context.commit("setPhenotypesInSession", PHENOTYPES);
        },
        diseaseInSession(context, DISEASE) {
            context.commit("setDiseaseInSession", DISEASE);
        },
        commonVariantsLength(context, NUM) {
            context.commit("setCommonVariantsLength", NUM);
        },

        async queryGeneName(context, symbol) {
            let name = context.state.geneToQuery || context.state.geneName;
            context.commit("setGeneName", name);
            
            let genesetSize = context.state.genesetSizeToQuery || context.state.genesetSize;
            let traitGroup = context.state.traitGroupToQuery || context.state.traitGroup;
            context.commit("setGenesetSize", genesetSize);
            context.commit("setTraitGroup", traitGroup);

            //console.log("genesetSize");

            if (!!name) {
                context.dispatch("gene/query", { q: name });
                context.dispatch("geneToTranscript/query", { q: name });
                
                //add pigean gene
                console.log("query gene name");
                let traitsData = [];
                for (let i = 0; i < bioIndexUtils.TRAIT_GROUPS.length; i++){
                    let group = bioIndexUtils.TRAIT_GROUPS[i];
                    let traitQuery = `${group},${context.state.geneName},${
                        bioIndexUtils.DEFAULT_SIGMA},${context.state.genesetSize}`;
                    let groupData = await bioIndexUtils.query("pigean-gene", traitQuery);
                    traitsData = traitsData.concat(groupData);
                }
                traitsData = traitsData.sort((a,b) => b.combined - a.combined);
                //console.log(traitsData.length);
                context.commit("setTraitsData", traitsData);
                //console.log(context.state.traitsData.length);
                
            }
        },
        ///

        async queryGeneRegion(context, region) {
            //To match with HuGE cal +- 300000 to the region
            let { chromosome, start, end } = region || context.getters.region;
            let q = `${chromosome}:${start - 300000}-${end + 300000}`;

            context.dispatch("genes/query", { q });
        },

        async queryUniprot(context, symbol) {
            let name = symbol || context.getters.canonicalSymbol;

            if (!!symbol) {
                context.dispatch("uniprot/getUniprotGeneInfo", name);
            }
        },

        async queryAssociations(context) {
            let query2 = { q: context.state.geneName,query_private:true };
            context.dispatch("associations52k_private/query", query2);
            

            let query = { q: context.state.geneName };
            context.dispatch("associations52k/query", query);
            context.dispatch("geneassociations/query", query);
            context.dispatch("geneExpression/query", query);
        },
        async getVarAssociationsData(context, phenotype) {
            let gene = context.state.geneName;
            let locus = await regionUtils.parseRegion(gene, true, 50000);

            if (locus) {
                context.state.newChr = locus.chr;
                context.state.newStart = locus.start;
                context.state.newEnd = locus.end;
            }

            const phenoRegionQuery = `${phenotype},${locus.chr}:${
                locus.start - 50000
            }-${locus.end + 50000}`;

            context.dispatch("varassociations/query", { q: phenoRegionQuery });
        },
        async get52KAssociationData(context) {
            let name = context.state.geneName;
            context.dispatch("associations52k/query", { q: name });
        },
        async getHugeScoresData(context) {
            //console.log("getHugeScoresData");
            let name = context.state.geneName;
            context.dispatch("hugeScores/query", { q: name });
        },
        phenotypeCorrelation(context, DATA) {
            context.commit("setPhenotypeCorrelation", DATA);
        },
        async getPigeanPhenotypes(context) {
            await context.dispatch("pigeanAllPhenotypes/query", {q:1});
        },
    },
});
