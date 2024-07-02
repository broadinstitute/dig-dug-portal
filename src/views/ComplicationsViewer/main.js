import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import keyParams from "@/utils/keyParams";
import UnauthorizedMessage from "@/components/UnauthorizedMessage";
import Documentation from "@/components/Documentation.vue";
import uiUtils from "@/utils/uiUtils";
import PhenotypePicker from "@/components/PhenotypePicker.vue";
import GeneFinderTable from "@/components/GeneFinderTable.vue";
import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue";
import CriterionListGroup from "@/components/criterion/group/CriterionListGroup.vue";
import FilterPValue from "@/components/criterion/FilterPValue.vue";
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue";
import FilterGreaterThan from "@/components/criterion/FilterGreaterThan.vue";
import FilterBasic from "@/components/criterion/FilterBasic";
import RawImage from "@/components/RawImage.vue";
import ManhattanPlot from "@/components/ManhattanPlot.vue";

import Alert, {
    postAlert,
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";
import { query } from "@/utils/bioIndexUtils";
import { difference } from "lodash"

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
        PhenotypePicker,
        Documentation,
        GeneFinderTable,
        UnauthorizedMessage,
        FilterPValue,
        FilterEnumeration,
        FilterGreaterThan,
        CriterionFunctionGroup,
        CriterionListGroup,
        FilterBasic,
        RawImage,
        ManhattanPlot,
    },

    data() {
        return {
            counter: 0,
            phenotypelist: [],
            complicationsViewerSearchCriterion: keyParams.condition
                ? [
                    {
                        field: "condition",
                        threshold: keyParams.condition
                    },
                    {
                        field: "secondaryPhenotype",
                        threshold: keyParams.secondaryPhenotype
                    }
                ]
                : [],
            geneFinderAssociationsMap: {},
        };
    },

    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("bioPortal/getDatasets");
        this.$store.dispatch("bioPortal/getDocumentations");
        this.$store.dispatch("bioPortal/getComplications");
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

        manhattanPlot() {
            let search = this.complicationViewerPhenotypes;
            let phenotype = search[0];
            if (!!phenotype) {
                return `/api/raw/plot/phenotype/${phenotype}/manhattan.png`;
            }
        },

        qqPlot() {
            let search = this.complicationViewerPhenotypes;
            let phenotype = search[0];

            if (!!phenotype) {
                return `/api/raw/plot/phenotype/${phenotype}/qq.png`;
            }
        },


        complicationPhenotypeOptions() {
            let x = this.$store.state.bioPortal.complications
                .filter(x => x.name == this.$store.state.phenotype);
            return x;
        },

        //find the selected comlication based on selected criterion
        //then get the phenotypes for the selected complication.
        //display all the keys
        complicationSecondaryPhenotypeOptions() {
            let selectedComplication = this.complicationsViewerSearchCriterion.filter(criterion => criterion.field === 'condition').map(criterion => criterion.threshold)[0];
            if (!!selectedComplication) {
                let phenotypes = Object.keys(this.$store.state.bioPortal.complicationsMap[selectedComplication].phenotypes);
                return phenotypes;
            }
        },
        phenotypes() {
            return this.complicationsViewerSearchCriterion
                .filter(criterion => criterion.field === 'condition')
                .map(criterion => criterion.threshold);
        },

        complicationViewerPhenotypes() {
            let complicationPhenotype = this.complicationsViewerSearchCriterion.filter(criterion => criterion.field === 'condition').map(criterion => criterion.threshold);
            let secondaryPhenotype = this.complicationsViewerSearchCriterion.filter(criterion => criterion.field === 'secondaryPhenotype').map(criterion => criterion.threshold);
            if (secondaryPhenotype.length > 0) {
                this.$store.commit("setSelectedSecondaryPhenotype", secondaryPhenotype);
                let complication = [this.$store.state.bioPortal.complicationsMap[complicationPhenotype].phenotypes[secondaryPhenotype]]
                let x = complication.concat(secondaryPhenotype)
                return x;
            }
            if (secondaryPhenotype.length == 0) {
                return []
            }
        },

        geneFinderPValue() {
            for (let i in this.complicationsViewerSearchCriterion) {
                if (this.complicationsViewerSearchCriterion[i].field == 'pValue') {
                    return Number(this.complicationsViewerSearchCriterion[i].threshold)
                }
            }

            return 0.05;
        },

        documentationMap() {
            let phenotype = this.complicationViewerPhenotypes[0];
            let secondaryphenotype = this.complicationViewerPhenotypes[1];
            return {
                phenotype: phenotype,
                secondaryphenotype: secondaryphenotype
            };
        },
    },

    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },

        complicationViewerPhenotypes(phenotypes) {
            this.$store.dispatch('findGenes', {
                primaryPhenotype: phenotypes[0],
                secondaryPhenotype: phenotypes[1],
                pValue: this.geneFinderPValue,
            });
        },
    }
}).$mount("#app");
