<template>
    <div>
        <div v-if="tableData.length > 0">
            <div class="text-right mb-2">
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
                        right
                        text="Show"
                        variant="outline-primary"
                        size="sm"
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
                        right
                        text="Show"
                        variant="outline-primary"
                        size="sm"
                        @click="showDetails()"
                    >
                        <b-dropdown-header id="dropdown-header-label">
                            Top 5 Gene Sets
                        </b-dropdown-header>
                        <b-dropdown-item
                            v-for="geneSet in row.item.top_gene_sets.split(';')"
                            :key="geneSet"
                            :href="`/pigean/geneset.html?geneset=${geneSet}$`"
                        >
                            {{ shorten(geneSet) }}
                        </b-dropdown-item>
                    </b-dropdown>
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
import DataDownload from "@/components/DataDownload.vue";
export default Vue.component("pigean-bayes-table", {
    components: {
        DataDownload,
    },
    props: ["pigeanData", "filter", "fields"],
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
        showDetails(){
            console.log("Details coming soon");
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
