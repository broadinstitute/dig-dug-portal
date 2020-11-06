import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import Template from "./Template.vue";
import store from "./store.js";

import FilterGroup from "@/components/Filter/FilterGroup.vue";
import FilterControl from "@/components/Filter/FilterControl.vue";
import FilterPValue from "@/components/Filter/FilterPValue.vue";
import FilterEnumeration from "@/components/Filter/FilterEnumeration.vue";
import FilterGreaterThan from "@/components/Filter/FilterGreaterThan.vue";

import { pageMixin } from "@/mixins/pageMixin";

Vue.use(BootstrapVue);
Vue.config.productionTip = false;

new Vue({
    store,
    mixins: [pageMixin],
    components: {
        FilterGroup,
        FilterControl,
        FilterPValue,
        FilterEnumeration,
        FilterGreaterThan
    },
    render(createElement, context) {
        return createElement(Template);
    },
    data() {
        return {
            masks: [
                { text: "LoF_HC", value: "bin1_7" },
                { text: "15of15 ", value: "bin2_7" },
                { text: "11of11 ", value: "bin3_7" },
                { text: "5of5", value: "bin4_7" },
                { text: "5of5_LoF_LC_1pct", value: "bin5_7" },
                { text: "1of5_1pct", value: "bin6_7" },
                { text: "0of5_1pct", value: "bin7_7" }
            ],
            auto_select: true,
            set_covariates: false,
            perPage: 10,
            currentPage: 1
        };
    },
    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("bioPortal/getDatasets");
        this.$store.dispatch("ldServer/getPhenotypes");
    },
    computed: {
        tableData() {
            return this.$store.state.variants.map(v => ({
                selected: true, //add selected column for manual selection
                ...v
            }));
        },
        selectedVariants() {
            //get only the varIDs for selected rows
            return this.tableData.filter(v => v.selected).map(v => v.varId);
        }
    },
    methods: {
        searchVariants() {
            this.$store.dispatch("queryBurden");
        },
        searchCovariances() {
            this.$store.dispatch("gene/query", {
                q: this.$store.state.searchGene
            });
            this.$store.dispatch("ldServer/getCovariances");
        }
    }
}).$mount("#app");
