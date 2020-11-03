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
                { LoF_HC: "bin1_7" },
                { "15of15 ": "bin2_7" },
                { "11of11 ": "bin3_7" },
                { "5of5": "bin4_7" },
                { "5of5_LoF_LC_1pct": "bin5_7" },
                { "1of5_1pct": "bin6_7" },
                { "0of5_1pct": "bin7_7" }
            ],
            auto_select: true,
            set_covariates: false
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
            return this.$store.state.burden.data;
        },
        selectedVariants() {
            return this.tableData.map(v => v.varId);
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
