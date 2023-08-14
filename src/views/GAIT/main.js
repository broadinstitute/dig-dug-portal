import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import Template from "./Template.vue";
import store from "./store.js";

import Documentation from "@/components/Documentation.vue";
import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue";
import CriterionListGroup from "@/components/criterion/group/CriterionListGroup.vue";
import FilterPValue from "@/components/criterion/FilterPValue.vue";
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue";
import FilterGreaterThan from "@/components/criterion/FilterGreaterThan.vue";
import FilterBasic from "@/components/criterion/FilterBasic";
import ForestPlotSimple from "@/components/ForestPlotSimple";
import Formatters from "@/utils/formatters";
import keyParams from "@/utils/keyParams";
import { query, match } from "@/utils/bioIndexUtils";
import { pageMixin } from "@/mixins/pageMixin";
import { isEqual, startCase } from "lodash";

Vue.use(BootstrapVue);
Vue.config.productionTip = false;

new Vue({
    el: "#app",
    store,
    components: {
        Documentation,
        CriterionFunctionGroup,
        CriterionListGroup,
        FilterPValue,
        FilterEnumeration,
        FilterGreaterThan,
        FilterBasic,
        ForestPlotSimple,
    },
    mixins: [pageMixin],
    data() {
        return {
            masks: [
                { text: "LofTee", value: "LoF_HC" },
                { text: "16/16", value: "16of16" },
                { text: "11/11 ", value: "11of11" },
                { text: "5/5", value: "5of5" },
                { text: "5/5 + LofTee LC", value: "5of5_LoF_LC" },
                { text: "5/5 + 1/5 1%", value: "1of5_1pct" },
                { text: "5/5 + 0/5 1%", value: "0of5_1pct" },
            ],
            datasets: [
                { text: "52K", value: "55k" },
                { text: "TOPMed", value: "TOPMed" },
            ],
            testMethods: [
                { text: "Collapsing Burden", value: "burden" },
                { text: "Variable Threshold", value: "vt" },
                { text: "SKAT", value: "skat" },
                { text: "SKAT Optimal", value: "skat-o" },
            ],
            topmedDatasets: ["T2D", "FG", "FI"],
            selectedMethods: [],
            matchingGenes: [],
            matchingTranscripts: [],
            showVariants: false,
            showCovariances: false,
            loadingVariants: false,
            loadingCovariances: false,
            criteriaChanged: false,
            testChanged: false,
            perPage: 10,
            currentPage: 1,
            baseFields: [
                {
                    key: "selected",
                    label: "Selected",
                    visible: true,
                    stickyColumn: true,
                },
                {
                    key: "varId",
                    label: "Variant ID",
                    visible: true,
                    sortable: true,
                },
                // {
                //     key: "geneId",
                //     label: "Gene ID",
                //     visible: true,
                //     sortable: true,
                // },
                // {
                //     key: "transcriptId",
                //     label: "Transcript ID",
                //     visible: true,
                //     sortable: true,
                // },
                // {
                //     key: "impact",
                //     label: "Impact",
                //     visible: true,
                //     sortable: true,
                // },
                {
                    key: "consequenceTerms",
                    label: "Consequence",
                    tdClass: "border-color",
                    visible: true,
                    sortable: false,
                },
                {
                    key: "proteinChange",
                    label: "Protein Change",
                    visible: true,
                    sortable: true,
                },
                {
                    key: "maf",
                    label: "Minor Allele Frequency",
                    visible: true,
                    sortable: true,
                },
            ],
            defaultFields: [
                //custom predefined and hidden fields
                "selected",
                "varId",
                "burdenBinId",
                // "caddRawRankscore",
                "impact",
                "maf",
                // "siftPred",
                // "polyphen2HdivPred",
                // "polyphen2HvarPred",
                // "lrtPred",
                // "mutationtasterPred",
                "gene",
                "pick",
                "transcript_id",
            ],
            fields: [],
            optionalFields: [
                {
                    key: "siftPred",
                    label: "SIFT",
                    visible: false,
                    sortable: true,
                },
                {
                    key: "polyphen2HdivPred",
                    label: "PPH Hdiv",
                    visible: false,
                    sortable: true,
                },
                {
                    key: "polyphen2HvarPred",
                    label: "PPH Hvar",
                    visible: false,
                    sortable: true,
                },
                {
                    key: "lrtPred",
                    label: "LRT",
                    visible: false,
                    sortable: true,
                },
                {
                    key: "mutationtasterPred",
                    label: "MutTas",
                    visible: false,
                    sortable: true,
                },
                {
                    key: "caddRawRankscore",
                    label: "CADD",
                    visible: false,
                    sortable: true,
                },
                {
                    key: "dannRankscore",
                    label: "DANN",
                    visible: false,
                    sortable: true,
                },
                {
                    key: "eigenPcRawCodingRankscore",
                    label: "Eigen-PC",
                    visible: false,
                    sortable: true,
                },
                {
                    key: "fathmmMklCodingPred",
                    label: "FATHMM-MKL",
                    visible: false,
                    sortable: true,
                },
                {
                    key: "fathmmPred",
                    label: "FATHMM",
                    visible: false,
                    sortable: true,
                },
                {
                    key: "lof",
                    label: "LOF",
                    visible: false,
                    sortable: true,
                },
                {
                    key: "proveanPred",
                    label: "PROVEAN",
                    visible: false,
                    sortable: true,
                },
                {
                    key: "vest4Rankscore",
                    label: "VEST4",
                    visible: false,
                    sortable: true,
                },
                {
                    key: "gnomadGenomesPopmaxAf",
                    label: "Max AF",
                    visible: false,
                    sortable: true,
                },
            ],

            searchCriteria: [],
            selectedVariants: [],
        };
    },
    computed: {
        frontContents() {
            let contents = this.$store.state.kp4cd.frontContents;
            if (contents.length === 0) {
                return {};
            }
            return contents[0];
        },
        phenotypeMap() {
            return this.$store.state.bioPortal.phenotypeMap;
        },
        visibleFields() {
            return this.fields.filter((field) => !!field.visible);
        },
        tableData() {
            if (
                this.$store.state.variants &&
                this.$store.state.variants.length
            ) {
                return this.$store.state.variants.map((v) => ({
                    selected: true, //add selected column for manual selection
                    ...v,
                }));
            } else {
                return [];
            }
        },

        selectedGene() {
            return (
                this.searchCriteria
                    .filter((v) => {
                        return v.field === "gene";
                    })
                    .map((v) => v.threshold) || []
            );
        },
        selectedTranscript() {
            return (
                this.searchCriteria
                    .filter((v) => {
                        return v.field === "transcript";
                    })
                    .map((v) => v.threshold) || []
            );
        },
        selectedMask() {
            return (
                this.searchCriteria
                    .filter((v) => {
                        return v.field === "mask";
                    })
                    .map((v) => v.threshold) || []
            );
        },
        selectedDataset() {
            return (
                this.searchCriteria
                    .filter((v) => {
                        return v.field === "dataset";
                    })
                    .map((v) => v.threshold) || []
            );
        },
        selectedPhenotypes() {
            return (
                this.selectedMethods
                    .filter((v) => {
                        return v.field === "phenotype";
                    })
                    .map((v) => v.threshold) || []
            );
        },
        selectedTests() {
            return (
                this.selectedMethods
                    .filter((v) => {
                        return v.field === "test";
                    })
                    .map((v) => v.threshold) || []
            );
        },
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
    },
    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },
        searchCriteria: {
            handler(newData, oldData) {
                if (!isEqual(newData, oldData)) {
                    this.criteriaChanged = true;
                }
            },
            deep: true,
        },
        selectedMethods: {
            handler(newData, oldData) {
                if (!isEqual(newData, oldData)) {
                    this.testChanged = true;
                }
            },
            deep: true,
        },
        selectedGene(newGene, oldGene) {
            if (!isEqual(newGene, oldGene)) {
                keyParams.set({ gene: newGene });
                //remove transcripts
                this.searchCriteria = this.searchCriteria.filter(
                    (v) => v.field !== "transcript"
                );
                this.matchingTranscripts = [];

                if (newGene.length > 0) {
                    this.lookupTranscripts(newGene[0]);
                }
            }
        },
        selectedTranscript(newTranscript, oldTranscript) {
            if (!isEqual(newTranscript, oldTranscript)) {
                keyParams.set({ transcript: newTranscript });
            }
        },
        selectedMask(newMask, oldMask) {
            //check for value change first, otherwise it gets triggered everytime filter change, forcing a recompute
            if (!isEqual(newMask, oldMask)) {
                keyParams.set({ mask: newMask });
            }
        },
        selectedDataset(newDataset, oldDataset) {
            if (!isEqual(newDataset, oldDataset)) {
                if (!isEqual([keyParams.dataset], newDataset)) {
                    this.selectedMethods = this.selectedMethods.filter((v) => {
                        return v.field !== "phenotype";
                    });
                }
                keyParams.set({ dataset: newDataset });
            }
        },
        selectedPhenotypes(newPhenotypes, oldPhenotypes) {
            if (!isEqual(newPhenotypes, oldPhenotypes)) {
                keyParams.set({
                    phenotypes: newPhenotypes.length
                        ? newPhenotypes.join(",")
                        : [],
                });
                this.$store.dispatch("onPhenotypeChange", newPhenotypes);
            }
        },
        selectedTests(newTests, oldTests) {
            if (!isEqual(newTests, oldTests)) {
                keyParams.set({
                    tests: newTests.length ? newTests.join(",") : [],
                });
            }
        },
        // "$store.state.variants": function () {
        //     this.loadingVariants = false;
        // },
        "$store.state.variants": function () {
            this.loadingVariants = false;
            if (
                this.$store.state.variants &&
                this.$store.state.variants.length
            ) {
                this.updateFields();
            }
        },
        "$store.state.ldServer.covariances": function () {
            this.loadingCovariances = false;
        },
        "$store.state.ldServer.runTestsError": function () {
            this.loadingCovariances = false;
        },
        tableData: {
            handler(newData, oldData) {
                if (!isEqual(newData, oldData)) {
                    this.updateSelectedVariants(); //update selected variants when tableData is ready
                    //when rows are selected or unselected, tableData won't change, only the selected rows changed
                    //updateSelectedVariants() function should be call when check/uncheck to update selected rows
                }
            },
            deep: true,
        },
    },
    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("bioPortal/getDatasets");
        this.$store.dispatch("ldServer/getPhenotypes");
        this.initCriteria();
        this.$store.dispatch("bioPortal/getDiseaseSystems");
    },
    methods: {
        intFormatter: Formatters.intFormatter,
        pValueFormatter: Formatters.pValueFormatter,
        effectFormatter: Formatters.effectFormatter,
        consequenceFormatter: Formatters.consequenceFormatter,
        zScoreFormatter(value) {
            if (!value) {
                return "-";
            }
            return Number.parseFloat(value).toFixed(7);
        },
        searchVariants() {
            this.showVariants = true;
            this.loadingVariants = true;
            this.$store.dispatch("queryBurden", {
                dataset: this.selectedDataset,
                gene: this.selectedGene,
                binID: this.selectedMask,
                transcriptID: this.selectedTranscript,
            });
            this.$store.dispatch("gene/query", {
                q: this.selectedGene,
            });
            this.criteriaChanged = false;
            this.$store.commit("ldServer/setCovariances", []);
        },
        searchCovariances() {
            this.showCovariances = true;
            this.loadingCovariances = true;
            this.$store.dispatch("ldServer/runTests", {
                variants: this.selectedVariants,
                phenotypes: this.selectedPhenotypes,
                dataset: this.selectedDataset,
                tests:
                    this.selectedTests.length > 0
                        ? this.selectedTests
                        : ["burden"],
            });
            this.testChanged = false;
        },
        updateFields() {
            this.fields = this.baseFields.concat(this.optionalFields);
        },
        formatTestData(samples, data) {
            let formatted = [];
            data.map((test) => {
                formatted.push({
                    test: test.test,
                    variants: test.variants.length,
                    zscore: test.stat,
                    pvalue: test.pvalue,
                    effect: test.effect,
                    se: test.se,
                    samples,
                });
            });
            return formatted;
        },
        async lookupGenes(input) {
            if (input) {
                let matches = await match("gene", input, { limit: 10 });
                this.matchingGenes = matches;
            }
        },
        async lookupTranscripts(input) {
            if (input) {
                let matches = await query("gene-to-transcript", input);
                this.matchingTranscripts = matches
                    .filter((t) => t["CCDS"])
                    .map((t) => t.transcript_id);
            }
        },
        initCriteria() {
            if (keyParams.gene)
                this.searchCriteria.push({
                    field: "gene",
                    threshold: keyParams.gene,
                });
            if (keyParams.transcript)
                this.searchCriteria.push({
                    field: "transcript",
                    threshold: keyParams.transcript,
                });
            if (keyParams.mask) {
                this.searchCriteria.push({
                    field: "mask",
                    threshold: keyParams.mask,
                });
            }
            if (keyParams.dataset) {
                this.searchCriteria.push({
                    field: "dataset",
                    threshold: keyParams.dataset,
                });
            }
            if (keyParams.phenotypes) {
                let phenotypes = keyParams.phenotypes.split(",");
                phenotypes.forEach((p) =>
                    this.selectedMethods.push({
                        field: "phenotype",
                        threshold: p,
                    })
                );
            }
            if (keyParams.tests) {
                let tests = keyParams.tests.split(",");
                tests.forEach((t) =>
                    this.selectedMethods.push({
                        field: "test",
                        threshold: t,
                    })
                );
            }
        },
        updateSelectedVariants() {
            //get only the varIDs for selected rows
            this.selectedVariants = this.tableData
                .filter((v) => {
                    return v.selected === true;
                })
                .map((v) => v.varId);
        },
        selectAllVariants() {
            this.tableData.forEach((v) => (v.selected = true));
            this.updateSelectedVariants();
        },
        deselectAllVariants() {
            this.tableData.forEach((v) => (v.selected = false));
            this.updateSelectedVariants();
        },
    },
    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
