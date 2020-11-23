import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import Template from "./Template.vue";
import store from "./store.js";

import Documentation from "@/components/Documentation.vue";
import FilterGroup from "@/components/Filter/FilterGroup.vue";
import FilterListGroup from "@/components/Filter/FilterListGroup.vue";
import FilterControl from "@/components/Filter/FilterControl.vue";
import FilterPValue from "@/components/Filter/FilterPValue.vue";
import FilterEnumeration from "@/components/Filter/FilterEnumeration.vue";
import FilterGreaterThan from "@/components/Filter/FilterGreaterThan.vue";
import FilterBasic from "@/components/Filter/FilterBasic";
import Formatters from "@/utils/formatters";
import keyParams from "@/utils/keyParams";
import { pageMixin } from "@/mixins/pageMixin";
import { isEqual, startCase } from "lodash";

Vue.use(BootstrapVue);
Vue.config.productionTip = false;

new Vue({
    store,
    mixins: [pageMixin],
    components: {
        Documentation,
        FilterGroup,
        FilterControl,
        FilterListGroup,
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
            showVariants: false,
            showCovariances: false,
            loadingVariants: false,
            loadingCovariances: false,
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
            searchCriteria: [
                {
                    field: "gene",
                    threshold: keyParams.gene
                },
                {
                    field: "dataset",
                    threshold: keyParams.dataset
                },
                {
                    field: "phenotype",
                    threshold: keyParams.phenotype
                },
                {
                    field: "masks",
                    threshold: keyParams.masks
                }
            ]
        };
    },
    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("bioPortal/getDatasets");
        this.$store.dispatch("ldServer/getPhenotypes");
    },
    computed: {
        visibleFields() {
            return this.fields.filter(field => !!field.visible);
        },
        tableData() {
            return this.$store.state.variants.map(v => ({
                selected: true, //add selected column for manual selection
                ...v
            }));
        },
        selectedVariants() {
            //get only the varIDs for selected rows
            return this.tableData.filter(v => v.selected).map(v => v.varId);
        },
        selectedPhenotypes() {
            return this.searchCriteria
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
            return this.searchCriteria
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
                    "z-score": test.stat,
                    "p-value": this.pValueFormatter(test.pvalue),
                    "Sample Size": this.intFormatter(samples)
                });
            });
            return formatted;
        }
    },
    watch: {
        selectedDataset(newDataset, oldDataset) {
            if (!isEqual(newDataset, oldDataset)) {
                console.log("change");
                this.searchCriteria = this.searchCriteria.filter(v => {
                    return v.field !== "phenotype";
                });
                //TODO: clear pill when clear phenotype
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
            this.updateFields();
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
