import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import CriterionFunctionGroup from "../../../../components/criterion/group/CriterionFunctionGroup.vue";
import FilterPValue from "../../../../components/criterion/FilterPValue.vue";
import FilterEnumeration from "../../../../components/criterion/FilterEnumeration.vue";
import FilterGreaterThan from "../../../../components/criterion/FilterGreaterThan.vue";
import FilterLessThan from "../../../../components/criterion/FilterLessThan.vue";
import SearchHeaderWrapper from "../../../../components/SearchHeaderWrapper.vue";
import TissueSelectPicker from "../../../../components/TissueSelectPicker.vue";
import Scatterplot from "../../../../components/Scatterplot.vue";
import MouseSummaryTable from "../../../../components/MouseSummaryTable.vue";
import MouseTissueSelect from "../../../../components/MouseTissueSelect.vue";
import MouseGeneSelect from "../../../../components/MouseGeneSelect.vue";
import MouseDiffExpTable from "../../../../components/MouseDiffExpTable.vue";
import MouseWhiskerPlot from "../../../../components/MouseWhiskerPlot.vue";
import ResearchPheWAS from "../../../../components/researchPortal/ResearchPheWAS.vue";
import HugeScoresTable from "../../../../components/HugeScoresTable.vue";
import UnauthorizedMessage from "../../../../components/UnauthorizedMessage";
import GeneAssociationsTable from "../../../../components/GeneAssociationsTable";
import GeneAssociationsMasks from "../../../../components/GeneAssociationsMasks";
import MouseSingleSearch from "../../components/MouseSingleSearch.vue";

import uiUtils from "../../../../utils/uiUtils.js";
import plotUtils from "../../../../utils/plotUtils.js";
import sortUtils from "../../../../utils/sortUtils.js";
import alertUtils from "../../../../utils/alertUtils.js";
import Formatters from "../../../../utils/formatters.js";
import dataConvert from "../../../../utils/dataConvert.js";
import keyParams from "../../../../utils/keyParams.js";
import regionUtils from "../../../../utils/regionUtils.js";

import "../../assets/layout.css";
import "../../assets/mouseportal.css";
import "../../assets/mdkp_copy.css";
import { pageMixin } from "../../../../mixins/pageMixin.js";
new Vue({
    store,
    components: {
        CriterionFunctionGroup,
        FilterPValue,
        FilterEnumeration,
        FilterGreaterThan,
        FilterLessThan,
        SearchHeaderWrapper,
        TissueSelectPicker,
        Scatterplot,
        MouseSummaryTable,
        MouseTissueSelect,
        MouseGeneSelect,
        MouseDiffExpTable,
        MouseWhiskerPlot,
        ResearchPheWAS,
        HugeScoresTable,
        UnauthorizedMessage,
        GeneAssociationsMasks,
        GeneAssociationsTable,
        MouseSingleSearch
    },
    mixins: [pageMixin],
    data() {
        return {
            currentPage: 1,
            perPage: 10,
            phenotypeFilterList: [],
            activeTab: "hugeScorePheWASPlot",
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
                type: "phewas plot",
                "render by": "phenotype",
                "group by": "group",
                "phenotype map": "kp phenotype map",
                "y axis field": "renderScore",
                "convert y -log10": "false",
                "y axis label": "Log(HuGE score)",
                "x axis label": "",
                "beta field": "null",
                "hover content": ["bf_common", "bf_rare", "huge"],
                thresholds: [Math.log(3), Math.log(30)],
                "label in black": "greater than",
                height: "600",
                "plot margin": {
                    left: 150,
                    right: 150,
                    top: 250,
                    bottom: 300,
                },
            },
            commonVariantRenderConfig: {
                type: "phewas plot",
                "render by": "phenotype",
                "group by": "phenotype group",
                "phenotype map": "kp phenotype map",
                "y axis field": "pValue",
                "convert y -log10": "true",
                "y axis label": "-Log10(p-value)",
                "x axis label": "beta",
                "beta field": "null",
                "hover content": ["pValue"],
                thresholds: ["2.5e-6"],
                height: "600",
                "plot margin": {
                    left: 150,
                    right: 150,
                    top: 250,
                    bottom: 300,
                },
            },
            mouseGeneOnly: false,
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
        rareVariantRenderConfig() {
            let config = structuredClone(this.commonVariantRenderConfig);
            config["beta field"] = "beta";
            config["hover content"].push("beta");
            config["thresholds"].push(0.05);
            return config;
        },
        phenotypeMap() {
            return this.$store.state.bioPortal.phenotypeMap;
        },
        diseaseSystem() {
            return this.$store.getters["bioPortal/diseaseSystem"];
        },
        homologRegion() {
            return this.$store.getters.region;
        },
        docDetails() {
            let r = this.homologRegion;
            return {
                tissue: this.tissue
                    ? this.tissue.toUpperCase().replaceAll("_", " ")
                    : "",
                gene: this.$store.state.gene,
                region: !!r
                    ? `${r.chromosome}:${Formatters.intFormatter(
                          r.start
                      )}-${Formatters.intFormatter(r.end)}`
                    : null,
            };
        },
        diffExpData() {
            let data = structuredClone(this.$store.state.diffExp.data);
            for (let i = 0; i < data.length; i++) {
                data[i].founder_sex = `${data[i].founder}_${data[i].sex}`;
            }
            return data;
        },
        geneassociations() {
            let data = this.$store.state.geneassociations.data;

            if (!!this.diseaseInSession && this.diseaseInSession != "") {
                data = sessionUtils.getInSession(
                    data,
                    this.phenotypesInSession,
                    "phenotype"
                );
            }

            let assocMap = {};

            for (let i in data) {
                const assoc = data[i];

                // skip associations not part of the disease group
                if (!this.phenotypeMap[assoc.phenotype]) {
                    continue;
                }

                const curAssoc = assocMap[assoc.phenotype];
                if (!curAssoc || assoc.pValue < curAssoc.pValue) {
                    assocMap[assoc.phenotype] = assoc;
                }
            }

            // convert to an array, sorted by p-value
            let x = Object.values(assocMap).sort((a, b) => a.pValue - b.pValue);
            return x;
        },
        transcriptOr52k() {
            let endpoint = !this.$store.state.selectedTranscript
                ? this.$store.state.associations52k
                : this.$store.state.transcriptAssoc;
            this.$store.state.restricted = endpoint.restricted;

            if (!!this.diseaseInSession && this.diseaseInSession != "") {
                endpoint.data = sessionUtils.getInSession(
                    endpoint.data,
                    this.phenotypesInSession,
                    "phenotype"
                );
            }

            let assocMap = {};

            for (let i in endpoint.data) {
                const assoc = endpoint.data[i];

                // skip associations not part of the disease group
                if (!this.phenotypeMap[assoc.phenotype]) {
                    continue;
                }

                const curAssoc = assocMap[assoc.phenotype];
                if (!curAssoc || assoc.pValue < curAssoc.pValue) {
                    assocMap[assoc.phenotype] = assoc;
                }
            }

            endpoint.data.sort(
                (a, b) =>
                    this.pValueFormatter(a.pValue) -
                    this.pValueFormatter(b.pValue)
            );

            return endpoint.data;
        },
        filteredAssociations() {
            return (
                this.geneassociations.filter((row) => {
                    return this.phenotypeMap[row.phenotype];
                }) || []
            );
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
        mouseOnly(){
            return this.mouseGeneOnly;
        }
        
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
        ancestryFormatter: Formatters.ancestryFormatter,
        pValueFormatter: Formatters.pValueFormatter,
        searchDiffExp() {
            this.$store.dispatch("queryDiffExp");
        },
        filterPhenotype(newFilters) {
            this.phenotypeFilterList = newFilters;
        },
        renderPhewas(REF) {
            this.activeTab = REF;
            let refComponent = this.$children[0].$refs[REF];
            setTimeout(function () {
                refComponent.renderPheWas();
            }, 500);
        },
    },
    watch: {
        "$store.state.homologGene"(newGene){
            console.log(JSON.stringify(newGene));
            this.mouseGeneOnly = false;
            if (newGene.data.length === 0){
                console.log("data missing");
                this.mouseGeneOnly = true;
            }
        }
    },
    render: (h) => h(Template),
}).$mount("#app");
