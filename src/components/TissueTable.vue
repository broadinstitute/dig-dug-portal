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
                    variant="primary"
                    class="p-0"
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
                    variant="primary"
                    class="p-0"
                    @click="
                        showLinks(r.item.gene);
                        r.toggleDetails();
                    "
                >
                    View
                </b-button>
            </template>
            <template #row-details="row">
                <div class="row">
                    <div class="col-12">
                        <b-table
                            :items="evidence"
                            :fields="fields"
                            :per-page="perPage"
                            :current-page="currentPage"
                        >
                        </b-table>
                    </div>
                </div>
                <div class="row">
                    <div class="col-12">
                        <b-table
                            :items="links"
                            :fields="fields"
                            :per-page="perPage"
                            :current-page="currentPage"
                        >
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
            evidence: [],
            links: [],
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
                //check if evidence already has key equal gene
                if (this.evidence.some((e) => e.hasOwnProperty(gene))) {
                    console.log("show evidence table");
                } else {
                    console.log("fetch evidence");
                    let data = await query("gene-expression", gene);
                    console.log(data);
                    this.evidence.push({ [gene]: data });
                    console.log(this.evidence);
                }
            }
            console.log("show evidence", this.evidence);
        },
        showLinks(gene) {
            console.log("show links", gene);
        },
    },
});
</script>
