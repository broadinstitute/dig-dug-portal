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
            :content-fill="$parent.documentationMap"
        ></documentation>
        <b-table
            small
            responsive="sm"
            :items="tableData[`${tissue.replaceAll('_', ' ')},${ancestry}`]"
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
                    v-b-popover.hover="'View biosamples'"
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
export default Vue.component("TissueHeritabilityTable", {
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
                            ? `All biosamples (${this.tissue.replaceAll(
                                  "_",
                                  " "
                              )})`
                            : value.replaceAll("_", " "),
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
            return (
                this.tableData[`${this.tissue},${this.ancestry}`]?.length || 0
            );
        },
    },
    mounted() {
        this.queryHeritability();
    },
    methods: {
        tissueFormatter: Formatters.tissueFormatter,
        phenotypeFormatter: Formatters.phenotypeFormatter,
        ancestryFormatter: Formatters.ancestryFormatter,
        queryHeritability() {
            let queryString = `${this.tissue.replaceAll("_", " ")},${
                this.ancestry
            }`;
            if (this.tissue && !this.tableData[queryString]) {
                query("partitioned-heritability-top-tissue", queryString, {
                    limit: 1000,
                }).then((data) => {
                    Vue.set(
                        this.tableData,
                        queryString,
                        data.filter((d) => !!this.phenotypeMap[d.phenotype])
                    );
                });
            }
        },
        async queryPartitionedHeritability(item) {
            let queryString = `${item.phenotype},${this.ancestry},${
                item.annotation
            },${this.tissue.replaceAll("_", " ")}`;
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
            },${this.tissue.replaceAll("_", " ")}`;
            return this.subTableData[query];
        },
    },
    watch: {
        "$store.state.selectedAncestry"(ancestry) {
            this.ancestry = ancestry === "" ? "Mixed" : ancestry;
            this.queryHeritability();
        },
    },
});
</script>

<style scoped>
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
}
</style>
