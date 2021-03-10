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
                responsive="sm"
                :items="variants"
                :fields="fields"
                :per-page="perPage"
                :current-page="currentPage"
                ><template #cell(view)="data">
                    <b-button
                        size="sm"
                        variant="outline-primary"
                        class="btn-mini"
                        @click="
                            showClumpData(data.item.phenotype, data.item.clump);
                            data.toggleDetails();
                        "
                    >
                        {{ data.detailsShowing ? "Hide" : "Show" }} Clump Data
                    </b-button>
                </template>
                <template #cell(effect_beta)="data">
                    <template
                        v-if="!phenotypeMap[data.item.phenotype].dichotomous"
                    >
                        <span
                            :class="`effect ${
                                data.item.beta < 0 ? 'negative' : 'positive'
                            }`"
                            >{{
                                effectFormatter(data.item.beta) < 0
                                    ? "&#9660;"
                                    : "&#9650;"
                            }}</span
                        ><span>{{ effectFormatter(data.item.beta) }}</span>
                    </template>
                </template>
                <template #cell(effect_or)="data">
                    <template
                        v-if="!!phenotypeMap[data.item.phenotype].dichotomous"
                    >
                        <span
                            :class="`effect ${
                                Math.exp(data.item.beta) < 1
                                    ? 'negative'
                                    : 'positive'
                            }`"
                            >{{
                                effectFormatter(Math.exp(data.item.beta)) < 1
                                    ? "&#9660;"
                                    : "&#9650;"
                            }}</span
                        ><span>{{
                            effectFormatter(Math.exp(data.item.beta))
                        }}</span>
                    </template>
                </template>
                <template #row-details="row">
                    <b-table
                        v-if="clumpData[row.item.phenotype]"
                        :items="clumpData[row.item.phenotype]"
                        :per-page="perPage"
                        :fields="effectFields(row.item.phenotype)"
                        :current-page="subCurrentPage[row.item.phenotype]"
                    >
                        <template #cell(effect)="data">
                            <template
                                v-if="
                                    !phenotypeMap[data.item.phenotype]
                                        .dichotomous
                                "
                            >
                                <span
                                    :class="`effect ${
                                        data.item.beta < 0
                                            ? 'negative'
                                            : 'positive'
                                    }`"
                                    >{{
                                        effectFormatter(data.item.beta) < 0
                                            ? "&#9660;"
                                            : "&#9650;"
                                    }}</span
                                ><span>{{
                                    effectFormatter(data.item.beta)
                                }}</span>
                            </template>

                            <template
                                v-if="
                                    !!phenotypeMap[data.item.phenotype]
                                        .dichotomous
                                "
                            >
                                <span
                                    :class="`effect ${
                                        Math.exp(data.item.beta) < 1
                                            ? 'negative'
                                            : 'positive'
                                    }`"
                                    >{{
                                        effectFormatter(
                                            Math.exp(data.item.beta)
                                        ) < 1
                                            ? "&#9660;"
                                            : "&#9650;"
                                    }}</span
                                ><span>{{
                                    effectFormatter(Math.exp(data.item.beta))
                                }}</span>
                            </template>
                        </template>
                    </b-table>
                    <b-pagination
                        v-if="clumpData[row.item.phenotype]"
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
    props: ["variants", "phenotypeMap"],
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
                    key: "group",
                    label: "Group",
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
                    key: "effect_beta",
                    label: "Beta",
                },
                {
                    key: "effect_or",
                    label: "Odds Ratio",
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
        effectFields(phenotype) {
            if (this.phenotypeMap[phenotype].dichotomous)
                return this.subFields.concat([
                    { key: "effect", label: "Odds Ratio" },
                ]);
            else {
                return this.subFields.concat([
                    { key: "effect", label: "Beta" },
                ]);
            }
        },

        effectFormatter(effect) {
            return Formatters.effectFormatter(effect);
        },
    },
});
</script>
