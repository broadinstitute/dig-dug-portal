import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import SearchHeaderWrapper from "@/components/SearchHeaderWrapper.vue";
import PigeanTable from "@/components/PigeanTable.vue";
import PigeanPlot from "@/components/PigeanPlot.vue";

import keyParams from "@/utils/keyParams";

Vue.config.productionTip = false;
Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);

new Vue({
    store,
    modules: {},
    components: {
        PageHeader,
        PageFooter,
        SearchHeaderWrapper,
        PigeanTable,
        PigeanPlot
    },

    data() {
        return {
            tableConfig: {
                fields: [
                    { key: "phenotype", sortable: true },
                    { key: "beta", sortable: true },
                    { key: "beta_uncorrected", sortable: true },
                    { key: "expand", label: "Genes"}
                ],
                queryParam: "gene_set",
                subtableEndpoint: "pigean-joined-gene-set",
                subtableFields: [
                    { key: "gene", sortable: true },
                    { key: "combined", sortable: true },
                    { key: "log_bf", sortable: true },
                    { key: "prior", sortable: true }
                ]
            }
        };
    },
    computed: {
        diseaseGroup() {
            return this.$store.getters["bioPortal/diseaseGroup"];
        },
        frontContents() {
            let contents = this.$store.state.kp4cd.frontContents;
            if (contents.length === 0) {
                return {};
            }
            return contents[0];
        },
    },
    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },
    },

    created() {
        this.$store.dispatch("queryGeneset", this.$store.state.geneset);
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
    },

    methods: {},

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
