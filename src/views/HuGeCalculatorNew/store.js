import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import kp4cd from "@/modules/kp4cd";
import bioIndex from "@/modules/bioIndex";
import ldServer from "@/modules/ldServer";
import regionUtils from "@/utils/regionUtils";
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
        regions: bioIndex("regions"),
        associations: bioIndex("associations"),
        geneAssociations52k: bioIndex("gene-associations-52k"),
    },
    state: {
        associationsData: {},
        variants: [],
        regionData: {},
        prior: 0.3696 || keyParams.prior,
        chr: keyParams.chr,
        start: keyParams.start,
        end: keyParams.end,
        newChr: keyParams.chr,
        newStart: keyParams.start,
        newEnd: keyParams.end,
        phenotypeParam: keyParams.phenotype,
        phenotype: null,
        searchGene: keyParams.gene,
        suggestedPriorNew: 0,
        universalPriorList: []

    },
    mutations: {
        setUniversalPriorList(state, universalPriorList) {
            state.universalPriorList = universalPriorList
        },
        setSuggestedPriorNew(state, suggestedPriorNew) {
            state.suggestedPriorNew = suggestedPriorNew
            console.log("updated suggested prior state to " + suggestedPriorNew)
        },
        setAssociationsData(state, associationsData) {
            state.associationsData = associationsData
        },
        setRegionData(state, regionData) {
            state.regionData = regionData
        },
        setPrior(state, prior) {
            state.prior = prior
            keyParams.set({ prior: prior })
        },
        setLocus(state, region = {}) {
            state.chr = region.chr || state.newChr || state.chr;
            state.start = region.start || state.newStart || state.start;
            state.end = region.end || state.newEnd || state.end;
            state.newChr = state.chr;
            state.newStart = state.start;
            state.newEnd = state.end;
            state.searchGene = null;
        },
        setPhenotype(state, phenotype) {
            state.phenotypeParam = phenotype;
            state.phenotype = state.bioPortal.phenotypeMap[phenotype];
            keyParams.set({ phenotype: phenotype });
        },
        setSearchGene(state, searchGene) {
            state.searchGene = searchGene
            keyParams.set({ gene: searchGene });
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
                }
            }
        },
    },
    actions: {
        async queryRegion(context, regionPhenotypeMap) {
            const newRegion = regionPhenotypeMap["region"] || context.getters.region;
            const phenotype = regionPhenotypeMap["phenotype"];
            context.commit("genes/clearData");
            context.commit("associations/clearData");
            if (
                context.state.newChr !== context.state.chr ||
                context.state.newStart !== context.state.start ||
                context.state.newEnd !== context.state.end
            ) {
                context.commit("setLocus");
            }

            const phenoRegionQuery = `${phenotype},${newRegion.chromosome}:${newRegion.start}-${newRegion.end}`;
            context.dispatch('associations/query', { q: phenoRegionQuery });
        },
        updatedUniversalSuggestedPriorList(context, universalPriorList) {
            context.commit('setUniversalPriorList', universalPriorList);

        },

        async getAssociationsData(context, phenoGeneInput) {
            let gene = phenoGeneInput["gene"];
            let phenotype = phenoGeneInput["phenotype"];
            let locus = await regionUtils.parseRegion(gene, true, 50000);

            if (locus) {
                context.state.newChr = locus.chr
                context.state.newStart = locus.start;
                context.state.newEnd = locus.end;
                //update the locus
                context.commit("setLocus", locus);
                context.commit("setPhenotype", phenotype);
                context.commit("setSearchGene", gene);
                context.commit("setPrior", 0.3696)
            }
            const phenoRegionQuery = `${phenotype},${locus.chr}:${locus.start}-${locus.end}`;
            context.dispatch('associations/query', { q: phenoRegionQuery });
        },

        async getRegion(context, gene) {
            context.dispatch('gene/query', { q: gene });


        },
        async getEGLData(context) {
            let dataset = "mccarthy";
            let trait = "t2d";
            context.dispatch("kp4cd/getEglData", { dataset, trait });
        },

        async get52KAssociationData(context, gene) {
            context.dispatch('geneAssociations52k/query', { q: gene });
        }
    }
});
