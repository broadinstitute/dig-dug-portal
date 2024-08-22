import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";
import { pageMixin } from "@/mixins/pageMixin";
import { match, query } from "@/utils/bioIndexUtils";
import VariantSearch from "@/components/VariantSearch";
Vue.config.productionTip = false;

new Vue({
    store,
    mixins: [pageMixin],

    components: { VariantSearch },

    data() {
        return {
            searchCriteria: [],
            matchingGenes: [],
            datasets: ["Farhan2019_ALS_eu"],
        };
    },
    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("bioPortal/getDatasets");
    },

    render(createElement, context) {
        return createElement(Template);
    },
    computed: {
        selectedGene() {
            return this.searchCriteria
                .filter((v) => {
                    return v.field === "gene";
                })
                .map((v) => v.threshold);
        },
        selectedDataset() {
            return this.searchCriteria
                .filter((v) => {
                    return v.field === "dataset";
                })
                .map((v) => v.threshold);
        },
    },
    methods: {
        async lookupGenes(input) {
            if (!!input) {
                let matches = await match("gene", input, { limit: 10 });
                this.matchingGenes = matches;
            }
        },
    },
}).$mount("#app");
