import Vue from "vue";
import Vuex from "vuex";

import $ from "jquery";

import bioIndex from "@/modules/bioIndex";
import getAggregatedData from "@/modules/getAggregatedData";
import graphPhenotype from "@/modules/graphPhenotype";
import kp4cd from "@/modules/kp4cd";
import diseaseGroup from "@/modules/diseaseGroup";

Vue.use(Vuex);

var url = new URL(document.URL);
let keyParam = {};
var c = url.searchParams.forEach((value, key) => {
    keyParam[key] = value;
});

keyParam.group = (keyParam.group == null) ? 'md' : keyParam.group;

export default new Vuex.Store({
    modules: {
        associations: bioIndex("Associations"),
        topAssociations: bioIndex("TopAssociations"),
        variants: getAggregatedData,
        phewas: getAggregatedData,
        phenotypes: getAggregatedData,
        graphPhenotype,
        kp4cd,
        diseaseGroup
    },
    state: {
        mdv: "mdv43",
        chrom: keyParam.chrom,
        start: Number(keyParam.start),
        end: Number(keyParam.end),
        phenotype: keyParam.phenotype,
        phenotypeName: keyParam.phenotype,
        newChrom: keyParam.chrom,
        newStart: Number(keyParam.start),
        newEnd: Number(keyParam.end),
    },
    mutations: {
        setPhenotype(state, phenotype) {
            state.phenotype = phenotype.id;
            $.each(phenotype.phenotypes, function (index, PHENOTYPE) {
                if (PHENOTYPE.phenotype_id == phenotype.id) { state.phenotypeName = PHENOTYPE.name };
            })
        },
        setSelectedPhenotype(state, phenotype) {
            state.phenotype = phenotype.phenotype_id;
            state.phenotypeName = phenotype.name;
        },
    },
    actions: {
        setLocation(state) {
            var chrom = this.state.newChrom;
            var start = this.state.newStart;
            var end = this.state.newEnd;

            window.location.href = "./gene.html?gene=&chrom=" + chrom + "&start=" + start + "&end=" + end;
        },
        onPhenotypeChange(state, phenotype) {
            mdkp.utility.showHideElement("phenotypeSearchHolder");
            state.commit("setSelectedPhenotype", phenotype);
        }
    }
});
