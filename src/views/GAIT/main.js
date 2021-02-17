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
import { match } from "@/utils/bioIndexUtils";
import { pageMixin } from "@/mixins/pageMixin";
import { isEqual, startCase } from "lodash";

Vue.use(BootstrapVue);
Vue.config.productionTip = false;

new Vue({
    store,
    mixins: [pageMixin],
    components: {
        Documentation,
        CriterionFunctionGroup,
        CriterionListGroup,
        FilterPValue,
        FilterEnumeration,
        FilterGreaterThan,
        FilterBasic,
        ForestPlotSimple
    },
    render(createElement, context) {
        return createElement(Template);
    },
    data() {
        return {
            masks: [
                { text: "LofTee", value: "LoF_HC" },
                { text: "16/16", value: "16of16" },
                { text: "11/11 ", value: "11of11" },
                { text: "5/5", value: "5of5" },
                { text: "5/5 + LofTee LC", value: "5of5_LoF_LC" },
                { text: "5/5 + 1/5 1%", value: "1of5_1pct" },
                { text: "5/5 + 0/5 1%", value: "0of5_1pct" }
            ],
            datasets: [
                { text: "52K", value: "52k" },
                { text: "TopMed", value: "TopMed" }
            ],
            testMethods: [
                { text: "Collapsing Burden", value: "burden" },
                { text: "Variable Threshold", value: "vt" },
                { text: "SKAT", value: "skat" },
                { text: "SKAT Optimal", value: "skat-o" }
            ],
            topmedDatasets: ["T2D", "FG", "FI"],
            selectedMethods: [],
            matchingGenes: [],
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
                    stickyColumn: true
                },
                {
                    key: "varId",
                    label: "Variant ID",
                    visible: true
                },
                {
                    key: "burdenBinId",
                    label: "Mask",
                    visible: true
                },
                {
                    key: "impact",
                    label: "Impact",
                    visible: true
                },
                {
                    key: "maf",
                    label: "Minor Allele Frequency",
                    visible: true
                }
            ],
            defaultFields: [
                //custom predefined and hidden fields
                "selected",
                "varId",
                "burdenBinId",
                "impact",
                "maf",
                "gene",
                "pick",
                "transcript_id"
            ],
            fields: [],
            optionalFields: [],
            searchCriteria: []
            // searchCriteria: keyParams.gene
            //     ? [
            //           {
            //               field: "gene",
            //               threshold: keyParams.gene
            //           }
            //       ]
            //     : []
        };
    },
    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("bioPortal/getDatasets");
        this.$store.dispatch("ldServer/getPhenotypes");
        this.initCriteria();
    },
    computed: {
        phenotypeMap() {
            return this.$store.state.bioPortal.phenotypeMap;
        },
        visibleFields() {
            return this.fields.filter(field => !!field.visible);
        },
        tableData() {
            if (
                this.$store.state.variants &&
                this.$store.state.variants.length
            ) {
                return this.$store.state.variants.map(v => ({
                    selected: true, //add selected column for manual selection
                    ...v
                }));
            } else {
                return [];
            }
        },
        selectedVariants() {
            //get only the varIDs for selected rows
            return this.tableData.filter(v => v.selected).map(v => v.varId);
        },
        selectedGene() {
            return this.searchCriteria
                .filter(v => {
                    return v.field === "gene";
                })
                .map(v => v.threshold);
        },
        selectedMasks() {
            return this.searchCriteria
                .filter(v => {
                    return v.field === "mask";
                })
                .map(v => v.threshold);
        },
        selectedDataset() {
            return this.selectedMethods
                .filter(v => {
                    return v.field === "dataset";
                })
                .map(v => v.threshold);
        },
        selectedPhenotypes() {
            return this.selectedMethods
                .filter(v => {
                    return v.field === "phenotype";
                })
                .map(v => v.threshold);
        },
        selectedTests() {
            return this.selectedMethods
                .filter(v => {
                    return v.field === "test";
                })
                .map(v => v.threshold);
        }
    },
    methods: {
        intFormatter: Formatters.intFormatter,
        pValueFormatter: Formatters.pValueFormatter,
        effectFormatter: Formatters.effectFormatter,
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
                gene: this.selectedGene,
                binID: this.selectedMasks
            });
            this.$store.dispatch("gene/query", {
                q: this.selectedGene
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
                        : ["burden"]
            });
            this.testChanged = false;
        },
        updateFields() {
            let addFields = [];
            Object.keys(this.tableData[0]).forEach(k => {
                if (this.defaultFields.indexOf(k) < 0) {
                    addFields.push({
                        key: k,
                        label: startCase(k),
                        visible: false
                    });
                }
            });

            this.optionalFields = addFields;
            this.fields = this.baseFields.concat(addFields);
        },
        formatTestData(samples, data) {
            let formatted = [];
            data.map(test => {
                formatted.push({
                    test: test.test,
                    variants: test.variants.length,
                    zscore: test.stat,
                    pvalue: test.pvalue,
                    effect: test.effect,
                    se: test.se,
                    samples
                });
            });
            return formatted;
        },
        async lookupGenes(input) {
            if (!!input) {
                let matches = await match("gene", input, { limit: 10 });
                this.matchingGenes = matches;
            }
        },
        initCriteria() {
            if (keyParams.gene)
                this.searchCriteria.push({
                    field: "gene",
                    threshold: keyParams.gene
                });
            if (keyParams.masks) {
                let masks = keyParams.masks.split(",");
                masks.forEach(m =>
                    this.searchCriteria.push({
                        field: "mask",
                        threshold: m
                    })
                );
            }
            if (keyParams.dataset) {
                this.selectedMethods.push({
                    field: "dataset",
                    threshold: keyParams.dataset
                });
            }
            if (keyParams.phenotypes) {
                let phenotypes = keyParams.phenotypes.split(",");
                phenotypes.forEach(p =>
                    this.selectedMethods.push({
                        field: "phenotype",
                        threshold: p
                    })
                );
            }
            if (keyParams.tests) {
                let tests = keyParams.tests.split(",");
                tests.forEach(t =>
                    this.selectedMethods.push({
                        field: "test",
                        threshold: t
                    })
                );
            }
        }
    },
    watch: {
        searchCriteria: {
            handler(newData, oldData) {
                if (!isEqual(newData, oldData)) {
                    this.criteriaChanged = true;
                }
            },
            deep: true
        },
        selectedMethods: {
            handler(newData, oldData) {
                if (!isEqual(newData, oldData)) {
                    this.testChanged = true;
                }
            },
            deep: true
        },
        selectedGene(newGene, oldGene) {
            if (!isEqual(newGene, oldGene)) {
                console.log("new gene", newGene);
                keyParams.set({ gene: newGene });
            }
        },
        selectedMasks(newMasks, oldMasks) {
            //check for value change first, otherwise it gets triggered everytime filter change, forcing a recompute
            if (!isEqual(newMasks, oldMasks)) {
                console.log("new mask", newMasks);
                keyParams.set({
                    masks: newMasks.length ? newMasks.join(",") : []
                });
            }
        },
        selectedDataset(newDataset, oldDataset) {
            if (!isEqual(newDataset, oldDataset)) {
                console.log("old dataset", [keyParams.dataset]);
                if (!isEqual([keyParams.dataset], newDataset)) {
                    console.log("different");
                    this.selectedMethods = this.selectedMethods.filter(v => {
                        return v.field !== "phenotype";
                    });
                }

                console.log("new dataset", newDataset);
                keyParams.set({ dataset: newDataset });
            }
        },
        selectedPhenotypes(newPhenotypes, oldPhenotypes) {
            //check for value change first, otherwise it gets triggered everytime filter change, forcing a recompute
            if (!isEqual(newPhenotypes, oldPhenotypes)) {
                console.log("new phenotype", newPhenotypes);
                keyParams.set({
                    phenotypes: newPhenotypes.length
                        ? newPhenotypes.join(",")
                        : []
                });
                this.$store.dispatch("onPhenotypeChange", newPhenotypes);
            }
        },
        selectedTests(newTests, oldTests) {
            //check for value change first, otherwise it gets triggered everytime filter change, forcing a recompute
            if (!isEqual(newTests, oldTests)) {
                console.log("new test", newTests);
                keyParams.set({
                    tests: newTests.length ? newTests.join(",") : []
                });
            }
        },
        "$store.state.variants": function() {
            this.loadingVariants = false;
            if (
                this.$store.state.variants &&
                this.$store.state.variants.length
            ) {
                this.updateFields();
            }
        },
        "$store.state.ldServer.covariances": function() {
            this.loadingCovariances = false;
        },
        "$store.state.ldServer.runTestsError": function() {
            this.loadingCovariances = false;
        }
    }
}).$mount("#app");
