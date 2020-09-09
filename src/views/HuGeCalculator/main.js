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
import GeneSelectPicker from "@/components/GeneSelectPicker.vue";
import AssociationsTable from "@/components/AssociationsTable.vue";
import PosteriorProbabilityPlot from "@/components/PosteriorProbabilityPlot.vue";
import ConfidenceIntervalPlot from "@/components/ConfidenceIntervalPlot.vue";
import ForestPlot from "@/components/ForestPlot.vue";
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
        GeneSelectPicker,
        PhenotypeSelectPicker,
        AssociationsTable,
        PosteriorProbabilityPlot,
        ConfidenceIntervalPlot,
        ForestPlot
    },

    data() {
        return {
            counter: 0,
            plotData: [
                {
                    beta: -60.571000000000005,
                    combinedAF: 0.0022796999999999995,
                    mask: "LofTee",
                    n: 25442,
                    pValue: 1.0166999999999999e-19,
                    passingVariants: 11,
                    singleVariants: 4,
                    stdErr: 6.6601
                }
            ],

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


        updateAssociationsTable(data) {
            this.$store.commit(`associations/setResponse`, data);
        },



    },
    mounted() {

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

        associationsData() {
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

        inGWAS() {
            let data = this.$store.state.associations.data;
            for (let i = 0; i < data.length; i++) {
                if (data[i].pValue <= 0.00000005) {
                    return true;
                }
            }
        },

        geneAssociations() {
            // let data = this.$store.state.geneAssociations;
            let trait = "T2D";
            if (!!this.$store.state.geneAssociations.data.length) {
                let data = this.$store.state.geneAssociations.data;
                for (let i = 0; i < data.length; i++) {
                    if (data[i].phenotype == trait) {
                        return data[i];
                    }
                    if (data[i].pValue <= 0.0000025) {
                        //if Exome wide significant
                        $store.commit('setStage2Category', "Strong coding evidence-Causal, 1C");
                    }
                    data[i].masks.forEach(r => {
                        if (r.mask == "LofTee") {
                            $store.commit("setHasLofTee", true);
                        }
                    })
                }
            }

        }
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
