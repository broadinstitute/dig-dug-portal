import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import PhenotypeSelect from "@/components/PhenotypeSelect.vue";
import LocusZoom from "@/components/LocusZoom";

Vue.config.productionTip = false;

new Vue({
    store,

    components: {
        PhenotypeSelect,
        LocusZoom
    },

    created() {
        let mdv = this.$store.state.mdv;
        let chrom = this.$store.state.chrom;
        let start = this.$store.state.start;
        let end = this.$store.state.end;
        let phenotype = this.$store.state.phenotype;
        this.$store.commit("variants/setCall", "variants");
        this.$store.commit("phenotypes/setCall", "phenotypes");
        this.$store.dispatch("variants/getAggregatedData", {
            mdv,
            chrom,
            start,
            end,
            phenotype
        });
        this.$store.dispatch("phenotypes/getAggregatedData", {
            mdv,
            chrom,
            start,
            end
        });
        this.$store.dispatch("graphPhenotype/list");
        //this.$store.dispatch("phewas/getAggregatedData");
    },

    render(createElement, context) {
        return createElement(Template);
    },

    computed: {
        variantsData() {
            return this.$store.state.variants.aggregatedData.variants;
        },
        phenotypesData() {
            return this.$store.state.phenotypes.aggregatedData.variants;
        },
        phewasData() {
            return this.$store.getters["phewas/aggregatedData"];
        },
        phenotype() {
            return this.$store.state.phenotype;
        },
        // phenotypes() {
        //     return this.$store.getters['graphPhenotype/phenotypes'];
        // },
        phenotypes() {
            let variants = this.$store.state.phenotypes.aggregatedData.variants;
            if (!variants) return [];
            return variants.map(v => v.phenotype);
        },
        phenotypeMap() {
            return this.$store.getters["graphPhenotype/phenotypes"];
        }
    },

    watch: {
        phenotype(phenotype) {
            let mdv = this.$store.state.mdv;
            let chrom = this.$store.state.chrom;
            let start = this.$store.state.start;
            let end = this.$store.state.end;
            this.$store.dispatch("variants/getAggregatedData", {
                mdv,
                chrom,
                start,
                end,
                phenotype
            });
        }
    }
}).$mount("#app");
