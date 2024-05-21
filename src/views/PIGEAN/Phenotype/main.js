import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import Template from "./Template.vue";
import store from "./store.js";

Vue.use(BootstrapVue);
Vue.config.productionTip = false;

import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import ResearchMPlot from "@/components/researchPortal/ResearchMPlot.vue";
import RawImage from "@/components/RawImage.vue";
import keyParams from "@/utils/keyParams";
import uiUtils from "@/utils/uiUtils";
import sessionUtils from "@/utils/sessionUtils";
import Alert from "@/components/Alert";
import SearchHeaderWrapper from "@/components/SearchHeaderWrapper.vue";
import SigmaSelectPicker from "@/components/SigmaSelectPicker.vue";
import GenesetSizeSelectPicker from "@/components/GenesetSizeSelectPicker.vue";
import PigeanTable from "@/components/PigeanTable.vue";
import PigeanPlot from "@/components/PigeanPlot.vue";
import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue";
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue";
import FilterGreaterLess from "@/components/criterion/FilterGreaterLess.vue";

new Vue({
    store,

    components: {
        PageHeader,
        PageFooter,
        Alert,
        SearchHeaderWrapper,
        SigmaSelectPicker,
        GenesetSizeSelectPicker,
        ResearchMPlot,
        RawImage,
        PigeanTable,
        PigeanPlot,
        CriterionFunctionGroup,
        FilterEnumeration,
        FilterGreaterLess
    },

    created() {
        this.$store.dispatch("bioPortal/getDiseaseSystems");
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("bioPortal/getDatasets");
    },

    render(createElement, context) {
        return createElement(Template);
    },
    data() {
        return {
            phenotypeSearchKey: null,
            newPhenotypeSearchKey: null,
            hidePValueFilter: true,
            geneFilterFields: [
                { key: "combined", label: "Combined" },
                { key: "combined_probability", label: "Combined probability" },
                { key: "huge_score", label: "GWAS evidence unweighted" },
                { key: "log_bf", label: "GWAS evidence weighted" },
                { key: "prior", label: "Gene set evidence"}
            ],
            tableConfig: {
                fields: [
                    { key: "gene", 
                        label: "Gene",
                        sortable: true },
                    { key: "combined",
                        label: "Combined",
                        showProbability: true,
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
                    { key: "sigma"},
                    { key: "expand", 
                        label: "Gene sets"}
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
                    { key: "sigma"}
                  ],
            },
            genesetFilterFields: [
                { key: "beta", label: "Effect (joint)" },
                { key: "beta_uncorrected", label: "Effect (marginal)" }
            ],
            genesetTableConfig: {
                fields: [
                    { key: "gene_set", 
                        label: "Gene set",
                        sortable: true },
                    { key: "beta", 
                        label: "Effect (joint)",
                        sortable: true },
                    { key: "beta_uncorrected", 
                        label: "Effect (marginal)",
                        sortable: true },
                    { key: "sigma"},
                    { key: "expand", 
                        label: "Genes"}
                ],
                queryParam: "gene_set",
                subtableEndpoint: "pigean-joined-gene-set",
                subtableFields: [
                    { key: "gene", 
                        label: "Gene",
                        sortable: true },
                    { key: "combined", 
                        label: "Combined",
                        showProbability: true,
                        sortable: true },
                    { key: "log_bf",
                        label: "GWAS evidence weighted",
                        sortable: true },
                    { key: "prior", 
                        label: "Gene set evidence",
                        sortable: true },
                    { key: "sigma"}
                ]
            }
        };
    },
    methods: {
        ...uiUtils,
        ...sessionUtils,
        setSelectedPhenotype(PHENOTYPE) {
            this.newPhenotypeSearchKey = PHENOTYPE.description;
            this.phenotypeSearchKey = null;
            this.$store.dispatch("selectedPhenotype", PHENOTYPE);
        },
        ifPhenotypeInSearch(DESCRIPTION) {
            let searchKeys = this.phenotypeSearchKey.split(" ");
            let isInPhenotype = 0;

            searchKeys.map((w) => {
                if (!!DESCRIPTION.toLowerCase().includes(w.toLowerCase())) {
                    isInPhenotype++;
                }
            });

            return isInPhenotype == searchKeys.length ? true : null;
        },
        clickedTab(tabLabel){
            this.hidePValueFilter = tabLabel === 'hugescore';
        }
    },

    computed: {
        /// for disease systems
        diseaseInSession() {
            if (this.$store.state.diseaseInSession == null) {
                return "";
            } else {
                return this.$store.state.diseaseInSession;
            }
        },
        phenotypesInSession() {
            if (this.$store.state.phenotypesInSession == null) {
                return this.$store.state.bioPortal.phenotypes;
            } else {
                return this.$store.state.phenotypesInSession;
            }
        },
        rawPhenotypes() {
            return this.$store.state.bioPortal.phenotypes;
        },
        ///
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
        plotReady(){
            return this.$store.state.genesetPhenotype.data.length > 0
                && this.$store.state.pigeanPhenotype.data.length > 0
                && Object.keys(this.$store.state.bioPortal.phenotypeMap).length > 0;
        }
    },

    watch: {
        "$store.state.bioPortal.phenotypeMap": function (phenotypeMap) {
            let name = keyParams.phenotype;
            let phenotype = phenotypeMap[name];

            if (!!phenotype) {
                this.$store.state.selectedPhenotype = phenotype;
                keyParams.set({ phenotype: phenotype.name });
            }
            //Initial query. Should only happen once.
            this.$store.dispatch("queryPhenotype");
        },

        "$store.state.phenotype": function (phenotype) {
            keyParams.set({ phenotype: phenotype.name });
            uiUtils.hideElement("phenotypeSearchHolder");
        },
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },
    },
}).$mount("#app");
