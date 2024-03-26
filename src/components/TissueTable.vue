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
                },
                {
                    key: "collection",
                    label: "Collection",
                },
                {
                    key: "dataset",
                    label: "Dataset",
                },
                {
                    key: "minTpm",
                    label: "Min. TPM",
                },
                {
                    key: "firstQuTpm",
                    label: "Q1 TMP",
                },
                {
                    key: "medianTpm",
                    label: "Median TPM",
                },
                {
                    key: "thirdQuTpm",
                    label: "Q3 TPM",
                },
                {
                    key: "maxTpm",
                    label: "Max. TPM",
                },
                {
                    key: "nSamples",
                    label: "Samples",
                },
            ],
            links: {},
            linksFields: [
                {
                    key: "targetGene",
                    label: "Target Gene",
                },
                {
                    key: "region",
                    label: "Region",
                },
                {
                    key: "targetRegion",
                    label: "Target Region",
                },
                {
                    key: "method",
                    label: "Method",
                },
                {
                    key: "source",
                    label: "Source",
                },
                {
                    key: "dataset",
                    label: "Dataset",
                },
                {
                    key: "assay",
                    label: "Assay",
                },
                {
                    key: "biosample",
                    label: "Biosample",
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
        async showLinks(gene) {
            if (gene) {
                //check if evidence object already has key equal gene
                if (!this.links[gene]) {
                    let data = await query(
                        "gene-links",
                        this.tissue.replace(" ", "_") + "," + gene
                    );

                    Vue.set(this.links, gene, data);
                }
            }
        },
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
