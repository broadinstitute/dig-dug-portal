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
import ResearchPheWAS from "@/components/researchPortal/ResearchPheWAS.vue";

import keyParams from "@/utils/keyParams";
import uiUtils from "@/utils/uiUtils";
import plotUtils from "@/utils/plotUtils";
import sortUtils from "@/utils/sortUtils";
import alertUtils from "@/utils/alertUtils";
import Formatters from "@/utils/formatters";
import dataConvert from "@/utils/dataConvert";


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
        PigeanPlot,
        ResearchPheWAS
    },

    data() {
        return {
            tableConfig: {
                fields: [
                    { key: "phenotype", 
                        label: "Phenotype",
                        sortable: true },
                    { key: "combined", 
                        label: "Combined",
                        sortable: true },
                    { key: "huge_score", 
                        label: "GWAS evidence unweighted",
                        sortable: true },
                    { key: "log_bf", 
                        label: "GWAS evidence weighted",
                        sortable: true },
                    { key: "prior", 
                        label: "Gene set evidence",
                        sortable: true },
                    { key: "expand", 
                        label: "Gene sets" } 
                  ],
                queryParam: "gene",
                subtableEndpoint: "pigean-joined-gene",
                subtableFields: [
                    { key: "gene_set", 
                        label: "Gene set",
                        sortable: true },
                    { key: "beta", 
                        label: "Effect (joint)",
                        sortable: true },
                  ],
            },
            plotColors: plotUtils.plotColors(),
            renderConfig: {
                type: 'phewas plot',
                'render by': 'phenotype',
                'group by': 'group',
                'phenotype map': 'kp phenotype map',
                'y axis field': 'combined',
                'convert y -log10': 'false',
                'y axis label': 'Combined',
                'x axis label': '',
                'beta field': 'null',
                'hover content': [
                    'combined',
                    'huge_score',
                    'log_bf',
                    'prior',
                ],
                thresholds: [Math.log(3), Math.log(30)],
                'label in black': 'greater than',
                height: '535',
                "plot margin": {
                    "left": 150,
                    "right": 180,
                    "top": 250,
                    "bottom": 300
                }
            },
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
        utilsBox() {
            let utils = {
                Formatters: Formatters,
                uiUtils: uiUtils,
                alertUtils: alertUtils,
                keyParams: keyParams,
                dataConvert: dataConvert,
                sortUtils: sortUtils,
                plotUtils: plotUtils,
            }
            return utils;
        },
        plotReady(){
            return this.$store.state.pigeanGene.data.length > 0
                && Object.keys(this.$store.state.bioPortal.phenotypeMap).length > 0;
        }
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
