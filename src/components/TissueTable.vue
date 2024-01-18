<template>
    <div id="tissues">
        <b-table
            hover
            small
            responsive="sm"
            :items="tableData"
            :fields="fields"
            :per-page="perPage"
            :current-page="currentPage"
        >
            <template #cell(evidence)="r">
                <b-button
                    v-b-popover.hover="'View evidence'"
                    size="sm"
                    variant="outline-primary"
                    class=""
                    @click="
                        showEvidence(r.item.gene);
                        r.toggleDetails();
                    "
                >
                    View
                </b-button></template
            >
            <template #cell(links)="r">
                <b-button
                    v-b-popover.hover="'View links'"
                    size="sm"
                    variant="outline-primary"
                    class=""
                    @click="
                        showLinks(r.item.gene);
                        r.toggleDetails();
                    "
                >
                    View
                </b-button>
            </template>
            <template #row-details="r">
                <div class="row">
                    <div v-if="evidence[r.item.gene]" class="col-12">
                        <h6>Evidence</h6>
                        <!-- show table with items from evidence if key is equal r.item.gene -->

                        <b-table
                            :items="evidence[r.item.gene]"
                            :fields="evidenceFields"
                            :per-page="perPage"
                            :current-page="currentPage"
                        >
                        </b-table>
                    </div>
                </div>
                <div class="row">
                    <div v-if="links[r.item.gene]" class="col-12">
                        <h6>Links</h6>
                        <b-table
                            :items="links[r.item.gene]"
                            :fields="linksFields"
                            :per-page="perPage"
                            :current-page="currentPage"
                            ><template #cell(region)="r">
                                {{ r.item.chromosome }}:{{ r.item.start }}-{{
                                    r.item.end
                                }}
                            </template>
                            <template #cell(targetRegion)="r">
                                {{ r.item.chromosome }}:{{
                                    r.item.targetGeneStart
                                }}-{{ r.item.targetGeneEnd }}
                            </template>
                        </b-table>
                    </div>
                </div>
            </template>
        </b-table>
        <b-pagination
            v-model="currentPage"
            :total-rows="tissueData.length"
            :per-page="perPage"
        >
        </b-pagination>
    </div>
</template>

<script>
import Vue from "vue";
import { query } from "@/utils/bioIndexUtils";
export default Vue.component("tissue-table", {
    props: {
        tissueData: {
            type: Array,
            required: true,
        },
        tissue: {
            type: String,
            required: true,
        },
    },
    data() {
        return {
            perPage: 10,
            currentPage: 1,
            fields: [
                {
                    key: "gene",
                    label: "Gene",
                },
                {
                    key: "meanTpm",
                    label: "Mean TPM",
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
            evidence: {},
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
        };
    },
    computed: {
        tableData() {
            return this.tissueData;
        },
    },
    methods: {
        async showEvidence(gene) {
            if (gene) {
                //check if evidence object already has key equal gene
                if (this.evidence[gene]) {
                    console.log("show evidence table");
                } else {
                    console.log("fetch evidence");
                    let data = await query("gene-expression", gene);
                    console.log(data);
                    //add data to evidence with key equal gene

                    Vue.set(this.evidence, gene, data);
                    console.log(this.evidence);
                    //console.log(JSON.stringify(this.evidence[0], null, 2));
                }
            }
            console.log("show evidence", this.evidence);
        },
        async showLinks(gene) {
            if (gene) {
                //check if evidence object already has key equal gene
                if (this.links[gene]) {
                    console.log("show links table");
                } else {
                    console.log("fetch links");
                    let data = await query(
                        "gene-links",
                        this.tissue + "," + gene
                    );

                    Vue.set(this.links, gene, data);
                    console.log(this.links);
                    //console.log(JSON.stringify(this.evidence[0], null, 2));
                }
            }
            console.log("show links", gene);
        },
    },
});
</script>
