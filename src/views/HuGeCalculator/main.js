import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";

import Documentation from "@/components/Documentation.vue";
import Autocomplete from "@/components/Autocomplete.vue";
import LocusZoom from "@/components/lz/LocusZoom";
import PhenotypeSelectPicker from "@/components/PhenotypeSelectPicker.vue";
import LocusZoomAssociationsPanel from "@/components/lz/panels/LocusZoomAssociationsPanel"
import HuGeCalculator from "@/components/HuGeCalculator.vue";
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
        Documentation,
        Autocomplete,
        LocusZoom,
        LocusZoomAssociationsPanel,

        PhenotypeSelectPicker
    },

    data() {
        return {
            counter: 0,

        };
    },

    created() {
        this.$store.dispatch("queryGeneName", this.$store.state.geneName);
        // get the disease group and set of phenotypes available
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");

    },

    render(createElement, context) {
        return createElement(Template);
    },

    methods: {
        ...uiUtils,
        postAlert,
        postAlertNotice,
        postAlertError,
        closeAlert,
        // addAssociationsPanel(event) {
        //     const { phenotype } = event;
        //     let finishHandler = this.updateAssociationsTable;
        //     const newAssociationsPanelId = this.$children[0].$refs.locuszoom.addAssociationsPanel(
        //         phenotype,
        //         finishHandler
        //     );
        //     return newAssociationsPanelId;
        // },

        updateAssociationsTable(data) {
            this.$store.commit(`associations/setResponse`, data);
        },
        // updateAssociationsPanel(phenotype) {
        //     if (this.currentAssociationsPanel) {
        //         this.$children[0].$refs.locuszoom.plot.removePanel(this.currentAssociationsPanel);
        //     }
        //     this.currentAssociationsPanel = this.addAssociationsPanel({ phenotype });
        // },

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


        region() {
            return this.$store.getters.region;
        },

        symbolName() {
            return this.$store.getters.canonicalSymbol;
        },

        gene() {
            let data = this.$store.state.gene;
            if (data.length > 0) {
                return data[0];
            }
            return {};
        },

        phenotypes() {
            return [this.$store.state.phenotype];
        },
        associationsData(state) {
            let data = this.$store.state.associations.data;
            let filteredData = [];
            data.forEach(function (row) {
                if (!!row.consequence) {
                    if (row.consequence == "missense_variant") {
                        filteredData.push(row);
                    }
                }

            })
            return filteredData;
        },

    },


    watch: {

        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },

        // the region for the gene was found
        region(region) {
            this.hideElement("variantSearchHolder");
            this.$store.dispatch("queryGeneRegion", region);

        },


    }
}).$mount("#app");
