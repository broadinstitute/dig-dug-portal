<template>
    <div id="tissues">
        <b-table
            small
            responsive="sm"
            :items="tissueTableData"
            :fields="fields"
            :per-page="perPage"
            :current-page="currentPage"
        >
            <template #head(gene)="r">
                <a @click="sortEmit(r.field.key)">{{ r.label }}</a>
            </template>
            <template #head(meanTpm)="r">
                <a @click="sortEmit(r.field.key)">{{ r.label }}</a>
            </template>
            <template #head(nSamples)="r">
                <a @click="sortEmit(r.field.key)">{{ r.label }}</a>
            </template>
            <template #cell(gene)="r">
                <a :href="`/gene.html?gene=${r.item.gene}`">
                    {{ r.item.gene }}
                </a>
            </template>
            <template #cell(evidence)="r">
                <b-button
                    v-b-popover.hover="'View evidence'"
                    size="sm"
                    variant="outline-primary"
                    class=""
                    @click="showDetails(r)"
                >
                    {{ r.detailsShowing ? "Hide" : "Show" }}
                </b-button>
            </template>
            <template #row-details="r">
                <div class="row">
                    <div class="col-12">
                        <!-- show table with items from evidence if key is equal r.item.gene -->

                        <b-table
                            :items="getEvidence(r.item.gene)"
                            :fields="evidenceFields"
                            :per-page="perPage"
                            :current-page="r.item.currentPage"
                        >
                            <template #cell(collection)="e">
                                {{ e.item.collection.join(", ") }}
                            </template>
                            <template #cell(dataset)="e">
                                <a
                                    :href="`https://cmdga.org/annotations/${e.item.dataset}/`"
                                    target="_blank"
                                >
                                    {{ e.item.dataset }}
                                </a>
                            </template>
                        </b-table>
                        <b-pagination
                            v-model="r.item.currentPage"
                            :total-rows="getEvidence(r.item.gene).length"
                            :per-page="perPage"
                        ></b-pagination>
                    </div>
                </div>
            </template>
        </b-table>
    </div>
</template>
<script>
import Vue from "vue";
import { query } from "@/utils/bioIndexUtils";
import Formatters from "@/utils/formatters";
export default Vue.component("TissueTable", {
    props: {
        tissueTableData: {
            type: Array,
            required: true,
        },
        tissue: {
            type: String,
            required: true,
        },
        filteredData: {
            type: Array,
            required: true,
        },
    },
    data() {
        return {
            perPage: 10,
            currentPage: 1,
            rawData: [],
            fields: [
                {
                    key: "gene",
                    label: "Gene",
                    thClass: "gene sortable",
                },
                {
                    key: "meanTpm",
                    label: "Mean TPM",
                    thClass: "meanTpm sortable",
                    formatter: Formatters.tpmFormatter
                },
                {
                    key: "nSamples",
                    label: "Total sample count",
                    thClass: "nSamples sortable",
                },
                {
                    key: "evidence",
                    label: "Evidence",
                },
            ],
            sortAscending: {
                gene: true,
                meanTpm: false,
                nSamples: false,
                tStat: false,
            },
            evidenceFields: [
                {
                    key: "biosample",
                    label: "Biosample",
                    formatter: Formatters.tissueFormatter,
                    sortable: true
                },
                {
                    key: "collection",
                    label: "Collection",
                },
                {
                    key: "dataset",
                    label: "Dataset",
                    sortable: true
                },
                {
                    key: "diseaseTermName",
                    label: "Disease",
                    sortable: true,
                    formatter: Formatters.tissueFormatter
                },
                {
                    key: "minTpm",
                    label: "Min. TPM",
                    formatter: Formatters.tpmFormatter,
                    sortable: true
                },
                {
                    key: "firstQuTpm",
                    label: "Q1 TMP",
                    formatter: Formatters.tpmFormatter,
                    sortable: true
                },
                {
                    key: "medianTpm",
                    label: "Median TPM",
                    formatter: Formatters.tpmFormatter,
                    sortable: true
                },
                {
                    key: "thirdQuTpm",
                    label: "Q3 TPM",
                    formatter: Formatters.tpmFormatter,
                    sortable: true
                },
                {
                    key: "maxTpm",
                    label: "Max. TPM",
                    formatter: Formatters.tpmFormatter,
                    sortable: true
                },
                {
                    key: "nSamples",
                    label: "Samples",
                    sortable: true
                },
            ],
            tableData: [],
            plotData: [],
        };
    },
    mounted() {
        if (this.tissueTableData) {
            this.tableData = this.tissueTableData.map((item) => {
                return { ...item, showButton: 0, currentPage: 1 };
            });
        }
        this.updateAriaSort("placeholder", true);
    },
    methods: {
        showDetails(row) {
            row.toggleDetails();
            Vue.set(row.item, "currentPage", 1);
        },
        getEvidence(gene) {
            return this.$props.filteredData.filter(
                (item) => item.gene === gene
            );
        },
        sortEmit(field) {
            let direction = this.sortAscending[field];
            this.$emit("sortByField", field, direction);
            // Clear previous active sort styling
            this.updateAriaSort(field, direction);
            this.sortAscending[field] = !direction;
        },
        updateAriaSort(field, direction) {
            document
                .querySelectorAll("#tissues th.sortable")
                .forEach((e) => (e.ariaSort = "none"));
            document
                .querySelectorAll(`#tissues th.${field}`)
                .forEach(
                    (e) => (e.ariaSort = direction ? "ascending" : "descending")
                );
        },
    },
});
</script>
<style scoped>
.row {
    font-size: smaller;
    margin-left: 15px;
    margin-right: 0;
    background-color: #efefef;
}

.row .col-12 {
    padding: 0 0 0 5px !important;
}
.b-popover {
    background-color: #fff;
}
.sortIcon {
    color: darkgray;
}
.active .activeIcon {
    color: #007bff;
}

</style>
