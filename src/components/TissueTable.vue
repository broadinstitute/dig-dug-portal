<template>
    <div id="tissues">
        <b-table
            hover
            small
            responsive="sm"
            :items="tissueData"
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
                </b-button></template
            >
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
                    <div v-if="evidence[r.item.gene]" class="col-12">
                        <h6>Evidence</h6>
                        <!-- show table with items from evidence if key is equal r.item.gene -->

                        <b-table
                            :items="evidence[r.item.gene]"
                            :fields="evidenceFields"
                            :per-page="perPage"
                            :current-page="r.item.currentPage"
                            ><template #cell(collection)="e">{{
                                e.item.collection.join(", ")
                            }}</template>
                        </b-table>
                        <b-pagination
                            v-model="r.item.currentPage"
                            :total-rows="evidence[r.item.gene].length"
                            :per-page="perPage"
                        ></b-pagination>
                    </div>
                </div>
                <div v-if="r.item.showButton === 2" class="row">
                    <div v-if="links[r.item.gene]" class="col-12">
                        <h6>Gene Links</h6>
                        <b-table
                            :items="links[r.item.gene]"
                            :fields="linksFields"
                            :per-page="perPage"
                            :current-page="currentPage"
                            ><template #cell(region)="l">
                                {{ l.item.chromosome }}:{{ l.item.start }}-{{
                                    l.item.end
                                }}
                            </template>
                            <template #cell(targetRegion)="l">
                                {{ l.item.chromosome }}:{{
                                    l.item.targetGeneStart
                                }}-{{ l.item.targetGeneEnd }}
                            </template>
                            <template #cell(assay)="l">
                                {{ l.item.assay.join(", ") }}
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
export default Vue.component("TissueTable", {
    props: {
        tissueData: {
            type: Array,
            required: true,
        },
        tissue: {
            type: String,
            required: true,
        },
        geneEvidence: {
            type: Object,
            reuquired: true
        }
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
                },
                {
                    key: "meanTpm",
                    label: "Mean TPM",
                },
                {
                    key: "nSamples",
                    label: "# Samples"
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
            evidence: this.$props.geneEvidence,
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
            plotData: []
        };
    },
    mounted() {
        if (this.tissueData) {
            this.tableData = this.tissueData.map((item) => {
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
                        this.tissue + "," + gene
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
    },

});
</script>
<style scoped>
.b-popover {
    background-color: #fff;
}
</style>
