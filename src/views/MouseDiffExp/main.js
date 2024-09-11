import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";
import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import Documentation from "@/components/Documentation.vue";
import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue";
import FilterPValue from "@/components/criterion/FilterPValue.vue";
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue";
import FilterGreaterThan from "@/components/criterion/FilterGreaterThan.vue";
import FilterLessThan from "@/components/criterion/FilterLessThan.vue";
import SearchHeaderWrapper from "@/components/SearchHeaderWrapper.vue";
import TissueSelectPicker from "@/components/TissueSelectPicker.vue";
import Scatterplot from "@/components/Scatterplot.vue";
import MouseSummaryTable from "@/components/MouseSummaryTable.vue";
import MouseTissueSelect from "@/components/MouseTissueSelect.vue";
import MouseGeneSelect from "@/components/MouseGeneSelect.vue";
import MouseDiffExpTable from "@/components/MouseDiffExpTable.vue";
import MouseWhiskerPlot from "@/components/MouseWhiskerPlot.vue";
import ResearchPheWAS from "@/components/researchPortal/ResearchPheWAS.vue";
import HugeScoresTable from "@/components/HugeScoresTable.vue";

import uiUtils from "@/utils/uiUtils";
import plotUtils from "@/utils/plotUtils";
import sortUtils from "@/utils/sortUtils";
import alertUtils from "@/utils/alertUtils";
import Formatters from "@/utils/formatters";
import dataConvert from "@/utils/dataConvert";
import keyParams from "@/utils/keyParams";
import regionUtils from "@/utils/regionUtils";

import ResearchSingleSearch from "@/components/researchPortal/ResearchSingleSearch.vue";
import { pageMixin } from "@/mixins/pageMixin";
new Vue({
    store,
    components: {
        PageHeader,
        PageFooter,
        Documentation,
        CriterionFunctionGroup,
        FilterPValue,
        FilterEnumeration,
        FilterGreaterThan,
        FilterLessThan,
        SearchHeaderWrapper,
        TissueSelectPicker,
        ResearchSingleSearch,
        Scatterplot,
        MouseSummaryTable,
        MouseTissueSelect,
        MouseGeneSelect,
        MouseDiffExpTable,
        MouseWhiskerPlot,
        ResearchPheWAS,
        HugeScoresTable
    },
    mixins: [pageMixin],
    data() {
        return {
            currentPage: 1,
            perPage: 10,
            plotColors: [
                "#007bff",
                "#048845",
                "#8490C8",
                "#BF61A5",
                "#EE3124",
                "#FCD700",
                "#5555FF",
                "#7aaa1c",
                "#9F78AC",
                "#F88084",
                "#F5A4C7",
                "#CEE6C1",
                "#cccc00",
                "#6FC7B6",
                "#D5A768",
                "#d4d4d4",
            ],
            phewasPlotMargin: {
                leftMargin: 150,
                rightMargin: 40,
                topMargin: 20,
                bottomMargin: 100,
                bump: 11,
            },
            hugeScoreRenderConfig: {
                "type": "phewas plot",
                "render by": "phenotype",
                "group by": "group",
                "phenotype map": "kp phenotype map",
                "y axis field": "renderScore",
                "convert y -log10": "false",
                "y axis label": "Log(HuGE score)",
                "x axis label": "",
                "beta field": "null",
                "hover content": ["bf_common", "bf_rare", "huge"],
                "thresholds": [Math.log(3), Math.log(30)],
                "label in black": "greater than",
                "height": "600",
                "plot margin": {
                    left: 150,
                    right: 150,
                    top: 250,
                    bottom: 300,
                },
            },
        };
    },
    computed: {
        utilsBox() {
            let utils = {
                Formatters: Formatters,
                uiUtils: uiUtils,
                alertUtils: alertUtils,
                keyParams: keyParams,
                dataConvert: dataConvert,
                sortUtils: sortUtils,
                plotUtils: plotUtils,
                regionUtils: regionUtils,
            };
            return utils;
        },
        phenotypeMap() {
            return this.$store.state.bioPortal.phenotypeMap;
        },

        diseaseGroup() {
            return this.$store.getters["bioPortal/diseaseGroup"];
        },
        diseaseSystem() {
            return this.$store.getters["bioPortal/diseaseSystem"];
        },
        docDetails() {
            return {
                tissue: this.tissue
                    ? this.tissue.toUpperCase().replaceAll("_", " ")
                    : "",
            };
        },
        diffExpData(){
            let data = structuredClone(this.$store.state.diffExp.data); 
            for (let i = 0; i < data.length; i++){
                data[i].founder_sex = `${data[i].founder}_${data[i].sex}`;
            }
            return data;
        },
        hugeScores() {
            let data = sortUtils.sortArrOfObjects(
                this.$store.state.hugeScores.data,
                "huge",
                "number",
                "desc"
            );

            if (!!this.diseaseInSession && this.diseaseInSession != "") {
                data = sessionUtils.getInSession(
                    data,
                    this.phenotypesInSession,
                    "phenotype"
                );
            }

            let hugeMap = {};

            for (let i in data) {
                const score = data[i];
                let phenotypeEntity =
                    this.$store.state.bioPortal.phenotypeMap[score.phenotype];
                score["group"] = phenotypeEntity
                    ? phenotypeEntity.group
                    : "No group info";
                score["renderScore"] = Math.log(data[i].huge);

                // skip associations not part of the disease group
                if (!this.phenotypeMap[score.phenotype]) {
                    continue;
                }

                hugeMap[score.phenotype] = score;
            }

            // convert to an array, sorted by p-value
            let x = Object.values(hugeMap);
            return x;
        },
    },
    created() {
        // get the disease group and set of phenotypes available
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("bioPortal/getDatasets");
        this.$store.dispatch("bioPortal/getDiseaseSystems");

        this.$store.dispatch("queryDiffExp");
    },
    methods: {
        tissueFormatter: Formatters.tissueFormatter,
        searchDiffExp(){
            this.$store.dispatch("queryDiffExp");
        }
    },
    render: (h) => h(Template),
}).$mount("#app");
