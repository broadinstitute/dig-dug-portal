<template>
    <div>
        <h4>
            Global enrichment for {{ tissueFormatter(tissue) }} (Ancestry:
            {{
                ancestry === "Mixed"
                    ? "Mixed meta-analysis"
                    : ancestryFormatter(ancestry)
            }})
        </h4>
        <div class="filtering-ui-wrapper container-fluid">
            <div class="row filtering-ui-content">
                <div class="col filter-col-md">
                    <div class="label">Ancestry</div>
                    <ancestry-selectpicker
                        :defaultMixed="true"
                        :ancestries="
                            $store.state.bioPortal.datasets.map(
                                (dataset) => dataset.ancestry
                            )
                        "
                    ></ancestry-selectpicker>
                </div>
            </div>
        </div>
        <documentation
            name="tissue.global-enrichment.subheader"
            :contentFill="$parent.docDetails"
            :contentMap="$store.state.bioPortal.documentations"
        ></documentation>
        <div v-if="itemData.length > 0">
            <div v-html="'Total rows: ' + itemData.length"
                class="table-total-rows"
            ></div>
            <div class="text-right mb-2">
                <data-download :data="itemData" :filename="`tissue_enrichment_${tissue}_${this.ancestry}`">
                </data-download>
            </div>
        </div>
        <b-table
            small
            responsive="sm"
            :items="itemData"
            :fields="fields"
            :per-page="perPage"
            :current-page="currentPage"
        >
            <template #cell(phenotype)="r">
                <a :href="`/phenotype.html?phenotype=${r.item.phenotype}`">
                    {{ phenotypeFormatter(phenotypeMap[r.item.phenotype]) }}
                </a>
            </template>
            <template #cell(biosample)="r"
                ><b-button
                    size="sm"
                    variant="outline-primary"
                    class=""
                    @click="showDetails(r)"
                >
                    {{ r.detailsShowing ? "Hide" : "Show" }}
                </b-button></template
            >
            <template #row-details="r">
                <div class="row">
                    <div class="col-12">
                        <b-table
                            :items="getSubTableData(r.item)"
                            :fields="subTableFields"
                            :per-page="perPage"
                            :current-page="r.item.currentPage"
                        >
                        </b-table>
                        <b-pagination
                            v-model="r.item.currentPage"
                            :total-rows="getSubTableData(r.item).length"
                            :per-page="perPage"
                        >
                        </b-pagination>
                    </div>
                </div>
            </template>
        </b-table>
        <b-pagination
            v-model="currentPage"
            :total-rows="totalRows"
            :per-page="perPage"
        >
        </b-pagination>
    </div>
</template>

<script>
import Vue from "vue";
import { query } from "@/utils/bioIndexUtils";
import Formatters from "@/utils/formatters";
import AncestrySelectpicker from "@/components/AncestrySelectPicker.vue";
import DataDownload from "@/components/DataDownload.vue";
export default Vue.component("TissueHeritabilityTable", {
    components: {
        DataDownload,
    },
    props: {
        tissue: {
            type: String,
            required: true,
        },
        phenotypeMap: {
            type: Object,
        },
    },
    data() {
        return {
            perPage: 10,
            currentPage: 1,
            fields: [
                {
                    key: "phenotype",
                    label: "Phenotype",
                    sortable: true,
                },
                {
                    key: "annotation",
                    label: "Annotation",
                    sortable: true,
                },
                {
                    key: "pValue",
                    label: "P-value",
                    formatter: Formatters.pValueFormatter,
                    sortable: true,
                },
                {
                    key: "enrichment",
                    label: "Enrichment",
                    formatter: Formatters.tpmFormatter,
                    sortable: true,
                },
                {
                    key: "biosample",
                    label: "Biosamples",
                },
            ],
            subTableFields: [
                {
                    key: "biosample",
                    label: "Biosample",
                    formatter: (value) =>
                        !value
                            ? `All biosamples (${this.toSpace(this.tissue)})`
                            : this.toSpace(value),
                    tdClass: (value) => (!value ? "all_biosamples" : ""),
                    sortable: true,
                },
                {
                    key: "pValue",
                    label: "P-value",
                    formatter: Formatters.pValueFormatter,
                    sortable: true,
                },
                {
                    key: "enrichment",
                    label: "Enrichment",
                    formatter: Formatters.tpmFormatter,
                    sortable: true,
                },
            ],
            tableData: {},
            subTableData: {},
            ancestry: "Mixed",
        };
    },
    computed: {
        totalRows() {
            return this.itemData?.length || 0;
        },
        tableKey(){
            return `${this.toSpace(this.tissue)},${this.ancestry}`;
        },
        itemData(){
            if (!this.tableData[this.tableKey]){
                return [];
            }
            return this.tableData[this.tableKey];
        },
        topPhenotype(){
            if (!this.itemData || this.itemData.length === 0){
                return "";
            }
            let item = this.itemData[0];
            for (let i = 0; i < this.itemData.length; i++){
                let nextItem = this.itemData[i];
                if (nextItem.pValue < item.pValue){
                    item = nextItem;
                }
            }
            return item.phenotype;
        }
        
    },
    watch: {
        "$store.state.selectedAncestry"(ancestry) {
            this.ancestry = ancestry === "" ? "Mixed" : ancestry;
            this.queryHeritability();
        },
        tissue: {
            immediate: true,
            handler() {
                this.queryHeritability();
            },
        },
        topPhenotype(newPhenotype){
            let details = {
                phenotype: newPhenotype,
                ancestry: this.ancestry
            };
            this.$emit("topPhenotypeFound", details);
        }
    },
    methods: {
        tissueFormatter: Formatters.tissueFormatter,
        phenotypeFormatter: Formatters.phenotypeFormatter,
        ancestryFormatter: Formatters.ancestryFormatter,
        queryHeritability() {
            if (this.tissue && !this.tableData[this.tableKey]) {
                query("partitioned-heritability-top-tissue", this.tableKey, {
                    limit: 1000,
                    limitWhile: (r) => r.pValue <= 1e-5,
                }).then((data) => {
                    Vue.set(
                        this.tableData,
                        this.tableKey,
                        data.filter((d) => !!this.phenotypeMap[d.phenotype])
                    );
                });
            }
        },
        async queryPartitionedHeritability(item) {
            let queryString = `${item.phenotype},${this.ancestry},${
                item.annotation
            },${this.toSpace(this.tissue)}`;
            if (!this.subTableData[queryString]) {
                let data = await query(
                    "partitioned-heritability-tissue",
                    queryString,
                    { limit: 1000 }
                );
                Vue.set(this.subTableData, queryString, data);
            }
        },
        showDetails(row) {
            row.toggleDetails();
            this.queryPartitionedHeritability(row.item);
        },
        getSubTableData(item) {
            let query = `${item.phenotype},${this.ancestry},${
                item.annotation
            },${this.toSpace(this.tissue)}`;
            return this.subTableData[query];
        },
        toSpace(phrase) {
            return phrase.replaceAll("_", " ");
        },
    },
});
</script>

<style scoped>
@import url("/css/table.css");
tr.b-table-details > td {
    padding: 0 !important;
}
.row {
    font-size: smaller;
    margin-left: 15px;
    margin-right: 0;
    background-color: #efefef;
}
.row .col-12 {
    padding: 0 0 0 5px !important;
}

.row .col-12 table.b-table {
    margin-bottom: 0 !important;
    font-size: 14px;
}
</style>
