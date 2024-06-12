<template>
    <div id="c2ct">
        <div v-if="rows > 0">
            <div class="text-right mb-2">
                <data-download :data="c2ctData" filename="c2ct"></data-download>
            </div>
            <b-table
                hover
                small
                responsive="sm"
                sort-icon-left
                :items="tableData"
                :fields="fields"
                :per-page="perPage"
                :current-page="currentPage"
                ><template #head(posteriorProbability)="data">
                    <span
                        v-b-tooltip.hover
                        title="Higher means greater overlap."
                        >{{ data.label }}
                    </span>
                </template>
                <template #head(Q)="data">
                    <span
                        v-b-tooltip.hover
                        title="This metric combines specificity and overlap probability. Higher means more confidence that the SNP overlaps a specific cell type."
                        >{{ data.label }}
                    </span>
                </template>
                <template #cell(chromosome)="r">
                    <a
                        :href="`research.html?pageid=kp_variant_sifter&phenotype=${
                            phenotype.name
                        }&region=${r.item.chromosome}:${
                            r.item.clumpStart >= 250000
                                ? r.item.clumpStart - 250000
                                : 0
                        }-${r.item.clumpEnd + 250000}`"
                    >
                        {{
                            `${r.item.chromosome}:${r.item.clumpStart}-${r.item.clumpEnd}`
                        }}
                    </a>
                </template>
                <template #cell(overlapLeadSNP)="r">
                    <a :href="`/variant.html?variant=${r.item.overlapLeadSNP}`">
                        {{ r.item.overlapLeadSNP }}
                    </a>
                </template>
            </b-table>
            <b-pagination
                v-model="currentPage"
                class="pagination-sm justify-content-center"
                :total-rows="rows"
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
export default Vue.component("c2ct-table", {
    components: {
        DataDownload,
    },
    props: ["c2ctData", "filter", "phenotype"],
    data() {
        return {
            perPage: 10,
            currentPage: 1,
            sortByCorrelation: false,
            fields: [
                {
                    key: "annotation",
                    label: "Annotation",
                    formatter: Formatters.annotationFormatter,
                    sortable: true,
                },
                {
                    key: "tissue",
                    label: "Tissue",
                    formatter: Formatters.tissueFormatter,
                    sortable: true,
                },
                {
                    key: "biosample",
                    label: "Biosample",
                    sortable: true,
                },
                {
                    key: "chromosome",
                    label: "Clump start - end",
                },
                {
                    key: "overlapLeadSNP",
                    label: "Overlap Lead SNP",
                },
                {
                    key: "posteriorProbability",
                    label: "Overlap probability",
                    formatter: Formatters.tpmFormatter,
                    sortable: true,
                },
                {
                    key: "totalEntropy",
                    label: "Total entropy",
                    formatter: Formatters.tpmFormatter,
                    sortable: true,
                },
                {
                    key: "Q",
                    label: "Combined score",
                    formatter: Formatters.tpmFormatter,
                    sortable: true,
                },
            ],
        };
    },
    computed: {
        rows() {
            return this.tableData.length;
        },
        tableData() {
            let dataRows = this.c2ctData;
            let filter = this.filter;
            if (filter) {
                dataRows = dataRows.filter((row) => filter(row));
            }
            return dataRows;
        },
    },
    methods: {
        pValueFormatter: Formatters.pValueFormatter,
        effectFormatter: Formatters.effectFormatter,
        intFormatter: Formatters.intFormatter,
        annotationFormatter: Formatters.annotationFormatter,
        tissueFormatter: Formatters.tissueFormatter,
        tpmFormatter: Formatters.tpmFormatter,
    },
});
</script>
<style scoped>
@import url("/css/effectorGenes.css");

label {
    margin: 10px;
}
</style>
