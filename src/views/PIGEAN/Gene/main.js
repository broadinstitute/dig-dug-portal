import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import SearchHeaderWrapper from "@/components/SearchHeaderWrapper.vue";
import GeneSelectPicker from "@/components/GeneSelectPicker.vue";
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
        GeneSelectPicker,
        PigeanTable,
        PigeanPlot
    },

    data() {
        return {
            tableConfig: {
                fields: [
                    { key: "phenotype", sortable: true },
                    { key: "combined", sortable: true },
                    { key: "log_bf", sortable: true },
                    { key: "prior", sortable: true },
                    { key: "expand", label: "Gene sets" } 
                  ],
                queryParam: "gene",
                subtableEndpoint: "pigean-joined-gene",
                subtableFields: [
                    { key: "gene_set", sortable: true },
                    { key: "beta", sortable: true },
                  ],
                
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
        region() {
            return this.$store.getters.region;
        },
        symbolName() {
            return this.$store.getters.canonicalSymbol;
        },
    },
    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },
    },

    created() {
        if (keyParams.gene) {
            console.log("gene", keyParams.gene);
        }
        this.$store.dispatch("queryGeneName", this.$store.state.geneName);
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
    },
    methods: {
        // go to region page
        exploreRegion(expanded = 0) {
            let r = this.region;

            if (r) {
                window.location.href = `../region.html?chr=${r.chromosome
                    }&start=${r.start - expanded}&end=${r.end + expanded}`;
            }
        },
    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
