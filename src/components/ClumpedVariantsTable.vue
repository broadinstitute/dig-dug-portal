<template>
    <div>
        <div class="text-right mb-2">
            <csv-download
                :data="variants"
                filename="clumped-variants"
            ></csv-download>
        </div>
        <div v-if="rows > 0">
            <b-table
                small
                bordered
                responsive="sm"
                :items="variants"
                :fields="fields"
                :per-page="perPage"
                :current-page="currentPage"
                ><template #cell(view)="data">
                    {{ data.item.phenotype }} - {{ data.item.clump }}
                    <b-button
                        size="sm"
                        variant="outline-primary"
                        class="mr-2 btn-mini"
                        @click="
                            showClumpData(data.item.phenotype, data.item.clump);
                            data.toggleDetails();
                        "
                    >
                        {{ data.detailsShowing ? "Hide" : "Show" }} Clump Data
                    </b-button>
                </template>
                <template #row-details="row"
                    >hello -
                    <b-table
                        v-if="clumpData[row.item.phenotype]"
                        :items="clumpData[row.item.phenotype]"
                        :per-page="perPage"
                        :fields="subFields"
                        :current-page="subCurrentPage[row.item.phenotype]"
                    ></b-table>
                    <b-pagination
                        class="pagination-sm justify-content-center"
                        v-model="subCurrentPage[row.item.phenotype]"
                        :total-rows="clumpData[row.item.phenotype].length"
                        :per-page="perPage"
                    ></b-pagination>
                </template>
            </b-table>
            <b-pagination
                class="pagination-sm justify-content-center"
                v-model="currentPage"
                :total-rows="rows"
                :per-page="perPage"
            ></b-pagination>
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import { query } from "@/utils/bioIndexUtils";
import Formatters from "@/utils/formatters";

export default Vue.component("clumped-variants-table", {
    props: ["variants"],
    data() {
        return {
            perPage: 10,
            currentPage: 1,
            subCurrentPage: {},
            fields: [
                {
                    key: "varId",
                    label: "Lead Variant",
                },
                {
                    key: "dbSNP",
                    label: "dbSNP",
                },
                {
                    key: "description",
                    label: "Phenotype",
                },
                {
                    key: "clump",
                    label: "Clump",
                },
                {
                    key: "pValue",
                    label: "P-Value",
                },
                {
                    key: "beta",
                    label: "Beta/OR",
                },
                { key: "view", label: "View" },
            ],
            subFields: [
                {
                    key: "varId",
                    label: "Variant",
                },
                {
                    key: "dbSNP",
                    label: "dbSNP",
                },
                {
                    key: "pValue",
                    label: "P-Value",
                },
                {
                    key: "beta",
                    label: "Beta/OR",
                },
            ],

            clumpData: {},
        };
    },

    computed: {
        rows() {
            return this.variants.length;
        },
    },

    methods: {
        async showClumpData(phenotype, clump) {
            // if (this.clumpData[phenotype] !== undefined)
            //     return this.clumpData[phenotype];
            // else {
            //     let clumpQuery = this.getClumpData(phenotype, clump);
            //     this.clumpData[phenotype] = clumpQuery.data;
            //     return clump;
            // }
            if (this.clumpData[phenotype] === undefined) {
                console.log("none");
                let clumpQuery = await this.getClumpData(phenotype, clump);
                console.log("get", clumpQuery);

                Vue.set(this.clumpData, phenotype, clumpQuery);
                Vue.set(this.subCurrentPage, phenotype, 1);
            }
        },
        async getClumpData(phenotype, clump) {
            return await query("clumped-variants", `${phenotype},${clump}`);
        },
    },
});
</script>
