<template>
    <div>
        <div v-if="tableData.length > 0">
            <div class="text-right mb-2">
                <data-download
                    :data="pigeanData"
                    filename="factors"
                ></data-download>
            </div>
            <div
                v-html="'Total rows: ' + rows"
                class="table-total-rows"
            ></div>
            <b-table
                small
                responsive="sm"
                :items="tableData"
                :fields="topFields"
                :per-page="perPage"
                :current-page="currentPage"
                :sort-by="sortBy"
                :sort-desc="true"
            >
                <template #cell(label)="r">
                    <span v-if="!!r.item.label">
                        {{
                            r.item.label.length > 50
                                ? `${r.item.label.slice(0, 50)}...`
                                : r.item.label
                        }}    
                    </span>
                </template>
                <template #cell(expand)="row">
                    <b-button
                        variant="outline-primary"
                        size="sm"
                        @click="showDetails(row, 1)"
                    >
                        {{
                            row.detailsShowing
                                ? "Hide"
                                : "Show"
                        }}
                    </b-button>
                </template>
                <template #cell(expand1)="row">
                    <b-dropdown
                        split
                        right
                        :text="
                            row.detailsShowing && row.item.subtableActive === 1
                                ? 'Hide'
                                : 'Show'
                        "
                        variant="outline-primary"
                        size="sm"
                        @click="showDetails(row, 1)"
                    >
                        <b-dropdown-header id="dropdown-header-label">
                            Top 5 Genes
                        </b-dropdown-header>
                        <b-dropdown-item
                            v-for="gene in row.item.top_genes.split(';')"
                            :key="gene"
                            :href="`/pigean/gene.html?gene=${gene}${suffix}`"
                        >
                            {{ gene }}
                        </b-dropdown-item>
                    </b-dropdown>
                </template>
                <template #cell(expand2)="row">
                    <b-dropdown
                        split
                        right
                        :text="
                            row.detailsShowing && row.item.subtableActive === 2
                                ? 'Hide'
                                : 'Show'
                        "
                        variant="outline-primary"
                        size="sm"
                        @click="showDetails(row, 2)"
                    >
                        <b-dropdown-header id="dropdown-header-label">
                            Top 5 Gene Sets
                        </b-dropdown-header>
                        <b-dropdown-item
                            v-for="geneSet in row.item.top_gene_sets.split(';')"
                            :key="geneSet"
                            :href="`/pigean/geneset.html?geneset=${geneSet}${suffix}`"
                        >
                            {{
                                geneSet.length > 40
                                    ? `${geneSet.slice(0, 40)}...`
                                    : geneSet
                            }}
                        </b-dropdown-item>
                    </b-dropdown>
                </template>
                <template #row-details="row">
                    <pigean-bayes-table
                        v-if="row.item.subtableActive === 2"
                        :pigeanData="geneData.filter(g => g.factor === row.item.factor)"
                    >
                    </pigean-bayes-table>
                    <pigean-bayes-table
                        v-if="row.item.subtableActive === 1"
                        :pigeanData="genesetData.filter(g => g.factor === row.item.factor)"
                    >
                    </pigean-bayes-table>
                </template>
            </b-table>
            <b-pagination
                v-model="currentPage"
                class="pagination-sm justify-content-center"
                :total-rows="tableData.length"
                :per-page="perPage"
            ></b-pagination>
        </div>
        <div v-else>
            <b-alert show variant="warning" class="text-center">
                <b-icon icon="exclamation-triangle"></b-icon> No data available
                for this query.
            </b-alert>
        </div>
    </div>
</template>
<script>
import Vue from "vue";
import { query } from "@/utils/bioIndexUtils";
import Formatters from "@/utils/formatters";
import DataDownload from "@/components/DataDownload.vue";
import keyParams from "@/utils/keyParams";
import PigeanTable from "./PigeanTable.vue";
import PigeanBayesTable from "@/components/PigeanBayesTable.vue";
import ResearchPheWAS from "@/components/researchPortal/ResearchPheWAS.vue";
import uiUtils from "@/utils/uiUtils";
import alertUtils from "@/utils/alertUtils";
import plotUtils from "@/utils/plotUtils";
import sortUtils from "@/utils/sortUtils";
import dataConvert from "@/utils/dataConvert";
export default Vue.component("factor-table", {
    components: {
        DataDownload,
        PigeanTable,
    },
    props: ["pigeanData", "phenotypeMap", "config", "filter", "phewasRenderConfig",
        "geneData", "genesetData"
    ],
    data() {
        return {
            perPage: 10,
            currentPage: 1,
            subtableData: {},
            subtable2Data: {},
            phewasData: {},
            plotColors: plotUtils.plotColors(),
            topFields: [
                {
                    key: "factor",
                    label: "Factor",
                    sortable: true
                },
                {
                    key: "gene_score",
                    label: "Gene score",
                    sortable: true
                },
                {
                    key: "gene_set_score",
                    label: "Gene set score",
                    sortable: true,
                },
                {
                    key: "label",
                    label: "Label",
                    sortable: true,
                },
                {
                    key: "top_genes",
                    label: "Top genes",
                    sortable: false,
                },
                {
                    key: "top_gene_sets",
                    label: "Top gene sets",
                    sortable: false
                }
            ]
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
            };
            return utils;
        },
        probFields() {
            return this.collateFields();
        },
        rows() {
            return this.pigeanData.length || 0;
        },
        tableData() {
            let data = structuredClone(this.pigeanData);
            //add subtableActive and phewasActive to each row
            data.forEach((row) => {
                row.subtableActive = 0;
                row.phewasActive = false;
            });
            if (this.filter) {
                data = data.filter(this.filter);
            }
            return data;
        },
        sigma() {
            return parseInt(keyParams.sigma.slice(-1));
        },
        genesetSize() {
            return keyParams.genesetSize;
        },
        suffix() {
            return `&sigma=sigma${this.sigma}&genesetSize=${this.genesetSize}`;
        },
    },
    methods: {
        phenotypeFormatter: Formatters.phenotypeFormatter,
        pValueFormatter: Formatters.pValueFormatter,
        effectFormatter: Formatters.effectFormatter,
        intFormatter: Formatters.intFormatter,
        annotationFormatter: Formatters.annotationFormatter,
        tissueFormatter: Formatters.tissueFormatter,
        tpmFormatter: Formatters.tpmFormatter,
        showDetails(row, tableNum) {
            this.toggleTable(row, tableNum);            
        },
        toggleTable(row, subtable){
            let show = false;
            if (subtable === 'phewas'){
                show = !row.item.phewasActive;
            } else if (subtable === row.item.subtableActive) {
                show = false;
            } else {
                show = true;
            }
            // Toggle active table
            if (subtable === 'phewas'){
                row.item.phewasActive = !row.item.phewasActive;
            } else {
                row.item.subtableActive = !show ? 0 : subtable;
            }
            // Hide details if it's currently showing and no tables should be active
            if (!show 
                && row.detailsShowing 
                && !row.item.phewasActive 
                && row.item.subtableActive === 0){
                row.toggleDetails();
            }
            // Show details if it's currently not showing but it should be
            if (show 
                && !row.detailsShowing 
                && (row.item.phewasActive || row.item.subtableActive !== 0)){
                    row.toggleDetails();
                }
            
        },
        phewasKey(item){
            return `${item.phenotype},${
                this.sigma},${
                this.genesetSize},${
                item.cluster}`;
        },
        generateId(label){
            return label.replaceAll(",","")
                .replaceAll(" ", "_");
        },
        probability(val, prior = 0.05) {
            let a = Math.exp(Math.log(prior) + val);
            return a / (1 + a);
        },
        collateFields() {
            let allFields = [];
            this.config.fields.forEach((field) => {
                if (field.showProbability) {
                    allFields.push({
                        key: `${field.key}_probability`,
                        sortable: true,
                    });
                }
                allFields.push(field);
            });
            return allFields;
        },
    },
});
</script>

<style scoped>
@import url("/css/effectorGenes.css");

label {
    margin: 10px;
}
.pigean-subtable {
    font-size: smaller;
    margin-left: 15px;
    background-color: #efefef;
}
.pigean-subtable .row .col-12 {
    padding: 0 0 0 5px !important;
}
ul.top-list {
    font-size: 0.8rem;
}
</style>
