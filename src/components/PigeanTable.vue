<script>
import Vue from "vue";
import { query } from "@/utils/bioIndexUtils";
import Formatters from "@/utils/formatters";
import DataDownload from "@/components/DataDownload.vue";
import keyParams from "@/utils/keyParams";
import PigeanTable from "./PigeanTable.vue";
import ResearchPheWAS from "@/components/researchPortal/ResearchPheWAS.vue";
import uiUtils from "@/utils/uiUtils";
import alertUtils from "@/utils/alertUtils";
import plotUtils from "@/utils/plotUtils";
import sortUtils from "@/utils/sortUtils";
import dataConvert from "@/utils/dataConvert";
export default Vue.component("pigean-table", {
    components: {
        DataDownload,
        PigeanTable,
    },
    props: ["pigeanData", "phenotypeMap", "config", "isSubtable", "filter", "phewasRenderConfig"],
    data() {
        return {
            perPage: 10,
            currentPage: 1,
            subtableData: {},
            subtable2Data: {},
            phewasData: {},
            plotColors: plotUtils.plotColors(),
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
        probData() {
            return this.computeProbabilities();
        },
        rows() {
            return this.pigeanData.length || 0;
        },
        sortBy() {
            return this.pigeanData.length === 0
                ? 0
                : this.config.fields
                      .map((field) => field.key)
                      .includes("factor_value")
                ? "factor_value"
                : this.config.sortBy
                ? this.config.sortBy
                : this.pigeanData[0]["combined"] !== undefined
                ? "combined"
                : "beta_uncorrected";
        },
        tableData() {
            let data = this.probData;
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
        phewasPlotShow(row){
            this.getPhewas(row);
            this.toggleTable(row, 'phewas');
        },
        async getSubtable(row, whichSubtable) {
            let queryKey = this.subtableKey(row.item);
            if (!this.subtableData[queryKey] && whichSubtable === 1) {
                let data = await query(this.config.subtableEndpoint, queryKey);
                Vue.set(this.subtableData, queryKey, data);
            }
            if (
                !!this.config.subtable2Endpoint &&
                !this.subtable2Data[queryKey] &&
                whichSubtable === 2
            ) {
                let data2 = await query(
                    this.config.subtable2Endpoint,
                    queryKey
                );
                Vue.set(this.subtable2Data, queryKey, data2);
            }
        },
        async getPhewas(row) {
            let queryKey = this.phewasKey(row.item);
            if (!this.phewasData[queryKey]){
                let data = await query("pigean-phewas", queryKey);
                Vue.set(this.phewasData, queryKey, data);
            }
        },
        showDetails(row, tableNum) {
            this.toggleTable(row, tableNum);
            this.getSubtable(row, tableNum);
            
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
        subtableKey(item) {
            if (this.config.queryParam === "cluster") {
                return `${item.phenotype},${this.sigma},${this.genesetSize},${item.cluster}`;
            }
            return `${item.phenotype},${item[this.config.queryParam]},${
                this.sigma
            },${this.genesetSize}`;
        },
        generateId(label){
            return label.replaceAll(",","")
                .replaceAll(" ", "_");
        },
        probability(val, prior = 0.05) {
            let a = Math.exp(Math.log(prior) + val);
            return a / (1 + a);
        },
        computeProbabilities() {
            let data = structuredClone(this.pigeanData);
            for (let i = 0; i < this.config.fields.length; i++) {
                let fieldConfig = this.config.fields[i];
                if (!fieldConfig.showProbability) {
                    continue;
                }
                let field = fieldConfig.key;
                for (let j = 0; j < data.length; j++) {
                    if (!!data[j][field]) {
                        data[j][`${field}_probability`] = this.tpmFormatter(
                            this.probability(data[j][field])
                        );
                    }
                }
            }
            return data;
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
<template>
    <div id="pigean-gene" :class="isSubtable ? 'pigean-subtable' : ''">
        <div v-if="tableData.length > 0">
            <div v-if="!isSubtable" class="text-right mb-2">
                <data-download
                    :data="probData"
                    filename="pigean_gene"
                ></data-download>
            </div>
            <b-table
                :hover="isSubtable"
                small
                responsive="sm"
                :items="tableData"
                :fields="probFields"
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
                <template #cell(gene)="r">
                    <a :href="`/pigean/gene.html?gene=${r.item.gene}${suffix}`">
                        {{ r.item.gene }}
                    </a>
                </template>
                <template #cell(phenotype)="r">
                    <a
                        v-if="!!phenotypeMap[r.item.phenotype]"
                        :href="`/pigean/phenotype.html?phenotype=${r.item.phenotype}${suffix}`"
                    >
                        {{ phenotypeFormatter(phenotypeMap[r.item.phenotype]) }}
                    </a>
                    <span v-else>{{ r.item.phenotype }}</span>
                </template>
                <template #cell(gene_set)="r">
                    <a
                        :href="`/pigean/geneset.html?geneset=${r.item.gene_set}${suffix}`"
                    >
                        {{ r.item.gene_set }}
                    </a>
                </template>
                <template #cell(phewasPlot)="row">
                    <b-button
                        variant="outline-primary"
                        size="sm"
                        @click="phewasPlotShow(row)"
                    >
                        {{ row.item.phewasActive ? "Hide" : "Show" }}
                    </b-button>
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
                    <research-phewas-plot
                        v-if="phewasData[phewasKey(row.item)]?.length > 0 && row.item.phewasActive"
                        style="width:100%"
                        :canvas-id="`pigean_${row.item.phenotype}_${
                            generateId(row.item.label)}`"
                        :plot-name="`PIGEAN_${row.item.phenotype}`"
                        :phenotypes-data="
                            phewasData[phewasKey(row.item)]
                        "
                        :phenotype-map="
                            $store.state.bioPortal.phenotypeMap
                        "
                        :colors="plotColors"
                        :render-config="phewasRenderConfig"
                        :utils="utilsBox"
                        :native-dl-btn="false"
                    >
                    </research-phewas-plot>
                    <pigean-table
                        v-if="
                            row.item.subtableActive === 2 &&
                            subtable2Data[subtableKey(row.item)]?.length > 0
                        "
                        :pigeanData="subtable2Data[subtableKey(row.item)]"
                        :config="{ fields: config.subtable2Fields }"
                        :isSubtable="true"
                    >
                    </pigean-table>
                    <pigean-table
                        v-if="
                            row.item.subtableActive === 1 &&
                            subtableData[subtableKey(row.item)]?.length > 0
                        "
                        :pigeanData="subtableData[subtableKey(row.item)]"
                        :config="{ fields: config.subtableFields }"
                        :isSubtable="true"
                    >
                    </pigean-table>
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
