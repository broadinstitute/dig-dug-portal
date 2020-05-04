import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import DbreferencesTable from "@/components/DbreferencesTable.vue";
import uiUtils from "@/utils/uiUtils";

import Alert, {
    postAlert,
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";

Vue.config.productionTip = false;
Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);

new Vue({
    store,
    modules: {},
    components: {
        PageHeader,
        PageFooter,
        Alert,
        DbreferencesTable,
    },
    data: {},

    created() {
        this.$store.dispatch("queryGene");
        // get the disease group and set of phenotypes available
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
    },

    render(createElement, context) {
        return createElement(Template);
    },

    data() {
        return {
            counter: 0
        };
    },

    methods: {
        ...uiUtils,
        postAlert,
        postAlertNotice,
        postAlertError,
        closeAlert,
    },

    computed: {
        frontContents() {
            let contents = this.$store.state.kp4cd.frontContents;
            if (contents.length === 0) {
                return {};
            }
            return contents[0];
        },

        diseaseGroup() {
            return this.$store.getters["bioPortal/diseaseGroup"];
        },

        symbolName() {
            let data = this.$store.state.genes.data;

            for (let i in data) {
                if (data[i].source === 'symbol') {
                    return data[i].name;
                }
            }
        },

        aliasNames() {
            return this.$store.state.genes.data.filter(g => g.source === 'alias');
        },

        alternateNames() {
            return this.$store.state.genes.data
                .filter(g => g.source !== 'symbol')
                .sort((a, b) => {
                    if (a.source < b.source) return -1;
                    if (a.source > b.source) return 1;
                    return 0;
                });
        },

        dbReference() {
            return this.$store.getters['uniprot/dbReference'];
        },

        accession() {
            return this.$store.getters['uniprot/accession'];
        },

        geneFunction() {
            return this.$store.getters['uniprot/geneFunction'];
        },

        geneNames() {
            return this.$store.getters['uniprot/geneNames'];
        },

        gene() {
            let data = this.$store.state.gene
            if (data.length > 0) {
                console.log(data[0])
                return data[0]
            }
            return {};
        }
    },

    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        }
    }
}).$mount("#app");
