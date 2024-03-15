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
                <span :class="{active: activeSort.field === r.field.key}">
                    <span class="sortIcon" :class="{activeIcon: activeSort.ascending}">
                        &#9650;
                    </span>
                    <span class="sortIcon" :class="{activeIcon: !activeSort.ascending}">
                        &#9660;
                    </span>
                </span>
            </template>
            <template #head(meanTpm)="r">
                <a @click="sortEmit(r.field.key)">{{ r.label }}</a>
                <span :class="{active: activeSort.field === r.field.key}">
                    <span class="sortIcon" :class="{activeIcon: activeSort.ascending}">
                        &#9650;
                    </span>
                    <span class="sortIcon" :class="{activeIcon: !activeSort.ascending}">
                        &#9660;
                    </span>
                </span>
            </template>
            <template #head(nSamples)="r">
                <a @click="sortEmit(r.field.key)">{{ r.label }}</a>
                <span :class="{active: activeSort.field === r.field.key}">
                    <span class="sortIcon" :class="{activeIcon: activeSort.ascending}">
                        &#9650;
                    </span>
                    <span class="sortIcon" :class="{activeIcon: !activeSort.ascending}">
                        &#9660;
                    </span>
                </span>
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
                    @click="
                        toToggle(r, 1, r.detailsShowing)
                            ? r.toggleDetails()
                            : ''
                    "
                >
                    {{
                        r.detailsShowing && r.item.showButton === 1
                            ? "Hide"
                            : "Show"
                    }}
                </b-button>
            </template>
            <template #cell(links)="r">
                <b-button
                    v-b-popover.hover="'View links'"
                    size="sm"
                    variant="outline-primary"
                    class=""
                    @click="
                        toToggle(r, 2, r.detailsShowing)
                            ? r.toggleDetails()
                            : ''
                    "
                >
                    {{
                        r.detailsShowing && r.item.showButton === 2
                            ? "Hide"
                            : "Show"
                    }}
                </b-button>
            </template>
            <template #row-details="r">
                <div v-if="r.item.showButton === 1" class="row">
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
                <div v-if="r.item.showButton === 2" class="row">
                    <div v-if="links[r.item.gene]" class="col-12">
                        <b-table
                            :items="links[r.item.gene]"
                            :fields="linksFields"
                            :per-page="perPage"
                            :current-page="r.item.currentPage"
                        >
                            <template #cell(targetGene)="l">
                                <a
                                    :href="`/gene.html?gene=${l.item.targetGene}`"
                                >
                                    {{ l.item.targetGene }}
                                </a>
                            </template>
                            <template #cell(region)="l">
                                <a
                                    :href="`/region.html?chr=${l.item.chromosome}&end=${l.item.end}&start=${l.item.start}`"
                                >
                                    {{ l.item.chromosome }}:{{
                                        l.item.start
                                    }}-{{ l.item.end }}
                                </a>
                            </template>
                            <template #cell(targetRegion)="l">
                                <a
                                    :href="`/region.html?chr=${l.item.chromosome}&end=${l.item.targetGeneEnd}&start=${l.item.targetGeneStart}`"
                                >
                                    {{ l.item.chromosome }}:{{
                                        l.item.targetGeneStart
                                    }}-{{ l.item.targetGeneEnd }}
                                </a>
                            </template>
                            <template #cell(dataset)="l">
                                <a
                                    :href="`https://cmdga.org/annotations/${l.item.dataset}/`"
                                    target="_blank"
                                >
                                    {{ l.item.dataset }}
                                </a>
                            </template>
                            <template #cell(assay)="l">
                                {{
                                    l.item.assay ? l.item.assay.join(", ") : ""
                                }}
                            </template>
                        </b-table>
                        <b-pagination
                            v-model="r.item.currentPage"
                            :total-rows="links[r.item.gene].length"
                            :per-page="perPage"
                        >
                        </b-pagination>
                    </div>
                </div>
            </template>
        </b-table>
    </div>
</template>
<script>
import Vue from "vue";
import { query } from "@/utils/bioIndexUtils";
import { active } from "d3";
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
                    thClass: "gene"
                },
                {
                    key: "meanTpm",
                    label: "Mean TPM",
                    thClass: "meanTpm"
                },
                {
                    key: "nSamples",
                    label: "Total sample count",
                    thClass: "nSamples"
                },
                {
                    key: "tstat",
                    label: "T-Stat",
                },
                {
                    key: "evidence",
                    label: "Evidence",
                },
                {
                    key: "links",
                    label: "Gene Links",
                },
            ],
            sortAscending: {
                gene: true,
                meanTpm: false,
                nSamples: false,
                tStat: false
            },
            activeSort: {
                field: "",
                ascending: false
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
        toToggle(row, buttonClicked, isShowing) {
            if (isShowing) {
                if (buttonClicked === row.item.showButton) return true;
                else {
                    if (buttonClicked === 1) {
                        Vue.set(row.item, "showButton", 1);
                    } else if (buttonClicked === 2) {
                        this.showLinks(row.item.gene);
                        Vue.set(row.item, "showButton", 2);
                    }
                }
                Vue.set(row.item, "currentPage", 1);
                return false;
            } else {
                if (buttonClicked === 1) {
                    Vue.set(row.item, "showButton", 1);
                } else if (buttonClicked === 2) {
                    this.showLinks(row.item.gene);
                    Vue.set(row.item, "showButton", 2);
                }
                Vue.set(row.item, "currentPage", 1);
                return true;
            }
        },
        setShowButton(item, value) {
            this.$set(item, "showButton", Number(value));
        },
        getEvidence(gene) {
            return this.$props.filteredData.filter(
                (item) => item.gene === gene
            );
        },
        sortEmit(field){
            let direction = this.sortAscending[field];
            this.$emit('sortByField', field, direction);
            // Clear previous active sort styling
            this.activeSort.field = field;
            this.activeSort.ascending = direction;
            this.updateAriaSort(field, direction);
            this.sortAscending[field] = !direction;
        },
        updateAriaSort(field, direction){
            document.querySelectorAll("#tissues th")
                .forEach( e => e.ariaSort = "none" );
            document.querySelectorAll(`#tissues th.${field}`)
                .forEach( e => e.ariaSort = direction ? "ascending" : "descending");
        }
    },
});
</script>
<style scoped>
.row {
    font-size: smaller;
    margin-left: 15px;
    margin-right: 15px;
    background-color: #dfdfdf;
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
