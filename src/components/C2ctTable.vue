<template>
    <div id="c2ct">
        <div v-if="rows > 0">
            <div>
                <div
                    v-html="'Total rows: ' + rows"
                    class="table-total-rows"
                ></div>
                <div class="text-right mb-2">
                    <data-download :data="c2ctData" :filename="`c2ct_${phenotype}`"></data-download>
                </div>
            </div>
            <b-table
                hover
                small
                responsive="sm"
                :items="tableData"
                :fields="!isTissuePage ? fields : fields.filter(f => f.key !== 'annotation')"
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
                <template #head(variantSifter)>
                    Open Variant Sifter (region: lead SNP &plusmn; 200kb)
                </template>
                <template #cell(tissue)="r">
                    <a :href="`/tissue.html?tissue=${r.item.tissue}`">
                        {{ tissueFormatter(r.item.tissue) }}
                    </a>
                </template>
                <template #cell(chromosome)="r">
                        {{
                            `${r.item.chromosome}:${r.item.clumpStart}-${r.item.clumpEnd}`
                        }}
                    
                </template>
                <template #cell(overlapLeadSNP)="r">
                    <a :href="`/variant.html?variant=${r.item.overlapLeadSNP}`">
                        {{ r.item.overlapLeadSNP }}
                    </a>
                </template>
                <template #cell(variantSifter)="r">
                    <a :href="exploreVariantSifter(r.item)">
                        <button type="button" class="btn btn-primary btn-sm">
                            Open
                        </button>
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
        <!-- <div v-else>
            <b-alert show variant="warning" class="text-center">
                <b-icon icon="exclamation-triangle"></b-icon> No data available
                for this query.
            </b-alert>
        </div> -->
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
    props: ["c2ctData", "filter", "phenotype", "isTissuePage"],
    data() {
        return {
            perPage: 10,
            currentPage: 1,
            sortByCorrelation: false,
            fields: [
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
                    key: "source",
                    label: "Source",
                    sortable: true,
                    formatter: Formatters.tissueFormatter,
                },
                {
                    key: "annotation",
                    label: "Annotation",
                    sortable: true,
                    formatter: Formatters.tissueFormatter,
                },
                {
                    key: "chromosome",
                    label: "Clump start - end",
                },
                {
                    key: "varTotal",
                    label: "Variants",
                    sortable: true,
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
                    label: "Genericity",
                    formatter: Formatters.tpmFormatter,
                    sortable: true,
                },
                {
                    key: "Q",
                    label: "Combined score",
                    formatter: Formatters.tpmFormatter,
                    sortable: true,
                },
                {
                    key: "variantSifter",
                    label: "variantSifter",
                    sortable: false,
                    tdClass: "text-center"
                }
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
        exploreVariantSifter(item, expanded = 200000) {
            let minimum = 10000;
            let location = item.overlapLeadSNP.split(":");
            let chr = location[0];
            let center = parseInt(location[1]);
            let start = center - expanded;
            start = start < minimum ? minimum : start;
            let end  = center + expanded;
            return '/research.html?pageid=kp_variant_sifter&phenotype=' +
				item.phenotype + '&region=' +
                chr + ':' +
                start + '-' +
                end;
        },
    },
});
</script>
<style scoped>
@import url("/css/table.css");
label {
    margin: 10px;
}
</style>
