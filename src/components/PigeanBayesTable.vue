<template>
    <div :class="isSubtable ? 'pigean-subtable' : ''">
        <div v-if="tableData.length > 0">
            <div class="text-right mb-2" v-if="!isSubtable">
                <data-download
                    :data="pigeanData"
                    filename="pigean_bayes"
                ></data-download>
            </div>
            <div
                v-html="'Total rows: ' + tableData.length"
                class="table-total-rows"
            ></div>
            <b-table
                hover
                small
                responsive="sm"
                :items="tableData"
                :fields="fields"
                :per-page="perPage"
                :current-page="currentPage"
                :sort-desc="true"
                :sort-by="'factor_value'"
            >
                <template #cell(label)="r">
                    <span v-if="!!r.item.label">
                        {{
                            shorten(r.item.label)
                        }}    
                    </span>
                </template>
                <template #cell(gene)="r">
                    <a :href="`/pigean/gene.html?gene=${r.item.gene}`">
                        {{ r.item.gene }}
                    </a>
                </template>
                <template #cell(phenotype)="r">
                    <a
                        v-if="!!phenotypeMap[r.item.phenotype]"
                        :href="`/pigean/phenotype.html?phenotype=${r.item.phenotype}`"
                    >
                        {{ phenotypeFormatter(phenotypeMap[r.item.phenotype]) }}
                    </a>
                    <span v-else>{{ r.item.phenotype }}</span>
                </template>
                <template #cell(gene_set)="r">
                    <a
                        :href="`/pigean/geneset.html?geneset=${r.item.gene_set}`"
                    >
                        {{ shorten(r.item.gene_set) }}
                    </a>
                </template>
                <template #cell(top_genes)="row">
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
                            :href="`/pigean/gene.html?gene=${gene}`"
                        >
                            {{ gene }}
                        </b-dropdown-item>
                    </b-dropdown>
                </template>
                <template #cell(top_gene_sets)="row">
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
                            :href="`/pigean/geneset.html?geneset=${geneSet}`"
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
                        v-if="row.item.subtableActive === 1"
                        :pigeanData="geneData.filter(g => g.label_factor === row.item.factor)"
                        :fields="geneFields"
                        :is-subtable="true"
                    >
                    </pigean-bayes-table>
                    <pigean-bayes-table
                        v-if="row.item.subtableActive === 2"
                        :pigeanData="genesetData.filter(g => g.label_factor === row.item.factor)"
                        :fields="genesetFields"
                        :is-subtable="true"
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
import Formatters from "@/utils/formatters";
import PigeanBayesTable from "./PigeanBayesTable.vue";
import DataDownload from "@/components/DataDownload.vue";
export default Vue.component("pigean-bayes-table", {
    components: {
        DataDownload,
    },
    props: ["pigeanData", "filter", "fields", "geneData", "genesetData", "isSubtable",
        "geneFields", "genesetFields", "phenotypeMap"
    ],
    data() {
        return {
            perPage: 10,
            currentPage: 1,
        };
    },
    computed: {
        tableData() {
            let data = structuredClone(this.pigeanData);
            if (this.filter) {
                data = data.filter(this.filter);
            }
            data.forEach((row) => {
                row.subtableActive = 0;
            });
            return data;
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
        shorten(longString){
            return longString.length > 40
                ? `${longString.slice(0, 40)}...`
                : longString
        },
        formatList(textList){
            return textList.split(";")
                .map(item => this.shorten(item));
        },
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
