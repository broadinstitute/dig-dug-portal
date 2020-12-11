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
        FilterBasic
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
            searchCriteria: keyParams.gene
                ? [
                      {
                          field: "gene",
                          threshold: keyParams.gene
                      }
                  ]
                : []
        };
    },
    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("bioPortal/getDatasets");
        this.$store.dispatch("ldServer/getPhenotypes");
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
        selectedPhenotypes() {
            return this.selectedMethods
                .filter(v => {
                    return v.field === "phenotype";
                })
                .map(v => v.threshold);
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
                    test: this.testMethods.find(t => t.value === test.test)
                        .text,
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
        }
    },
    watch: {
        searchCriteria: {
            handler(newData, oldData) {
                // console.log("search changed");
                // console.log("new", newData);
                // console.log("old", oldData);
                if (!isEqual(newData, oldData)) {
                    this.criteriaChanged = true;
                    //console.log("not equal");
                }
            },
            deep: true
        },
        selectedMethods(newData, oldData) {
            // console.log("method changed");
            // console.log("new", newData);
            // console.log("old", oldData);
            if (!isEqual(newData, oldData)) {
                this.testChanged = true;
                // console.log("not equal");
            }
        },
        selectedDataset(newDataset, oldDataset) {
            if (!isEqual(newDataset, oldDataset)) {
                console.log("change");
                this.selectedMethods = this.selectedMethods.filter(v => {
                    return v.field !== "phenotype";
                });
            }
        },
        selectedPhenotypes(newPhenotypes, oldPhenotypes) {
            //check for value change first, otherwise it gets triggered everytime filter change, forcing a recompute
            if (!isEqual(newPhenotypes, oldPhenotypes)) {
                this.$store.dispatch("onPhenotypeChange", newPhenotypes);
            }
        },
        "$store.state.variants": function() {
            console.log("change1");
            this.loadingVariants = false;
            if (
                this.$store.state.variants &&
                this.$store.state.variants.length
            ) {
                this.updateFields();
            }
        },
        "$store.state.ldServer.covariances": function() {
            console.log("change2");
            this.loadingCovariances = false;
        },
        "$store.state.ldServer.runTestsError": function() {
            console.log("change3");
            this.loadingCovariances = false;
        }
    }
}).$mount("#app");
