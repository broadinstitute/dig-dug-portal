import Vue from "vue";
import Vuex from "vuex";


import getAggregatedData from "@/modules/getAggregatedData";
import graphPhenotype from "@/modules/graphPhenotype";

Vue.use(Vuex);

var url = new URL(document.URL);
let keyParam = {};
var c = url.searchParams.forEach((value, key) => {
  keyParam[key] = value;
});

var dChrom = keyParam.chrom;
var dStart = Number(keyParam.start);
var dEnd = Number(keyParam.end);
var dPhenotype = "T2D";
var dPhenotypeName = "T2D";

export default new Vuex.Store({
    modules: {
        variants: getAggregatedData,
        phewas: getAggregatedData,
        phenotypes: getAggregatedData,
        graphPhenotype
    },
    state: {
        mdv: "mdv41",
        chrom: dChrom,
        start: dStart,
        end: dEnd,
        phenotype: dPhenotype,
        phenotypeName:dPhenotypeName,
    },
    mutations: {
        setPhenotype(state, phenotype) {
            state.phenotype = phenotype.id;
            $.each(phenotype.phenotypes, function(index,PHENOTYPE) {
                if( PHENOTYPE.phenotype_id == phenotype.id ) {state.phenotypeName = PHENOTYPE.name};
            })
        },
        setSelectedPhenotype(state, phenotype) {
            state.phenotype = phenotype.phenotype_id;
            state.phenotypeName = phenotype.name;
        },
        setLocation(state, chrom, start, end) {
            state.chrom = chrom;
            state.start = start;
            state.end = end;
        },
    },
    actions: {
        onPhenotypeChange(state, phenotype) {
            mdkp.utility.showHideElement("#phenotypeSearchHolder");
            state.commit("setSelectedPhenotype", phenotype);
        }
    }
});
