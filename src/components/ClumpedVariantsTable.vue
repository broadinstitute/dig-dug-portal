<template>
    <div id="clump-data">
        <b-row>
            <b-col v-if="legends && groups != null" cols="9">
                <div
                    v-for="group in groups"
                    :key="group"
                    class="pws-group-legend"
                >
                    <div
                        class="pws-group-legend-box phenotype-group"
                        :style="
                            'background-color: ' +
                            getColor(group) +
                            ' !important;'
                        "
                    >
                        <!--<div
						class="pws-group-legend-box phenotype-group"
						:class="group"
					>-->
                        &nbsp;
                    </div>
                    {{ group }}
                </div>
            </b-col>
            <b-col class="text-right">
                <data-download
                    :data="variants"
                    filename="clumped-variants"
                ></data-download>
            </b-col>
        </b-row>
        <div class="text-right mb-2"></div>
        <div v-if="rows > 0">
            <b-table
                small
                hover
                responsive="sm"
                sort-icon-left
                :items="variants"
                :fields="fields"
                :per-page="perPage"
                :current-page="currentPage"
            >
                <template #cell(varId)="data">
                    <a :href="`/variant.html?variant=${data.item.varId}`">
                        {{ data.item.varId }}
                    </a>
                </template>
                <template #cell(dbSNP)="data">
                    <a :href="`/variant.html?variant=${data.item.dbSNP}`">
                        {{ data.item.dbSNP }}
                    </a>
                </template>
                <template #cell(description)="data">
                    <a :id="data.item.phenotype" style="cursor: help">
                        {{ data.item.description }}
                    </a>
                    <b-popover
                        :target="data.item.phenotype"
                        triggers="hover"
                        placement="top"
                    >
                        <b-list-group flush>
                            <b-list-group-item
                                href="#"
                                @click="addPhenotype(data.item.phenotype)"
                                >Add this phenotype below</b-list-group-item
                            >

                            <b-list-group-item
                                :href="`/phenotype.html?phenotype=${data.item.phenotype}`"
                                >Go to phenotype page</b-list-group-item
                            >
                        </b-list-group>
                    </b-popover>
                </template>
                <template #cell(group)="data">
                    <div
                        class="border-color"
                        :style="
                            'border-color: ' +
                            getColor(data.item.group) +
                            ' !important;'
                        "
                    >
                        {{ data.item.group }}
                    </div>
                    <!--<div class="border-color" :class="data.item.group">
						{{ data.item.group }}
					</div>-->
                </template>
                <template #cell(pValue)="data">
                    <div
                        class="pValue"
                        :style="`background-size: ${pValueCss(
                            data.item.pValue
                        )}% 100%`"
                    >
                        {{ pValueFormatter(data.item.pValue) }}
                    </div>
                </template>
                <template #cell(view)="data">
                    <b-button
                        size="sm"
                        variant="outline-primary"
                        class="btn-mini showData"
                        @click="
                            showClumpData(
                                data.item.phenotype,
                                data.item.clump,
                                $store.state.ancestry
                            );
                            data.toggleDetails();
                        "
                    >
                        <span v-if="!!loadingData[data.item.phenotype]">
                            <b-spinner small></b-spinner>
                            <span class="sr-only">Loading...</span>
                        </span>
                        <span v-else>
                            {{ data.detailsShowing ? "Hide" : "Show" }}
                            Variants
                        </span>
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
                        >
                            {{
                                effectFormatter(data.item.beta) < 0
                                    ? "&#9660;"
                                    : "&#9650;"
                            }}
                        </span>
                        <span>{{ effectFormatter(data.item.beta) }}</span>
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
                        >
                            {{
                                effectFormatter(Math.exp(data.item.beta)) < 1
                                    ? "&#9660;"
                                    : "&#9650;"
                            }}
                        </span>
                        <span>
                            {{ effectFormatter(Math.exp(data.item.beta)) }}
                        </span>
                    </template>
                </template>
                <template #row-details="row">
                    <div class="details">
                        <b-table
                            v-if="
                                clumpData[
                                    `${row.item.phenotype},${$store.state.ancestry}`
                                ]
                            "
                            :items="
                                clumpData[
                                    `${row.item.phenotype},${$store.state.ancestry}`
                                ]
                            "
                            :per-page="perPage"
                            :fields="
                                effectFields(
                                    `${row.item.phenotype},${$store.state.ancestry}`
                                )
                            "
                            :current-page="
                                subCurrentPage[
                                    `${row.item.phenotype},${$store.state.ancestry}`
                                ]
                            "
                        >
                            <template #cell(varId)="data">
                                <a
                                    :href="`/variant.html?variant=${data.item.varId}`"
                                    >{{ data.item.varId }}</a
                                >
                            </template>
                            <template #cell(dbSNP)="data">
                                <a
                                    :href="`/variant.html?variant=${data.item.dbSNP}`"
                                    >{{ data.item.dbSNP }}</a
                                >
                            </template>
                            <template #cell(effect)="data">
                                <span
                                    :class="`effect ${
                                        data.item.beta < 0
                                            ? 'negative'
                                            : 'positive'
                                    }`"
                                >
                                    {{
                                        data.item.beta < 0
                                            ? "&#9660;"
                                            : "&#9650;"
                                    }}
                                </span>
                                <span
                                    v-if="
                                        !phenotypeMap[data.item.phenotype]
                                            .dichotomous
                                    "
                                    >{{ effectFormatter(data.item.beta) }}</span
                                >
                                <span v-else>
                                    {{
                                        effectFormatter(
                                            Math.exp(data.item.beta)
                                        )
                                    }}
                                </span>
                            </template>
                        </b-table>
                        <b-pagination
                            v-if="
                                clumpData[
                                    `${row.item.phenotype},${$store.state.ancestry}`
                                ]
                            "
                            v-model="
                                subCurrentPage[
                                    `${row.item.phenotype},${$store.state.ancestry}`
                                ]
                            "
                            :total-rows="
                                clumpData[
                                    `${row.item.phenotype},${$store.state.ancestry}`
                                ].length
                            "
                            :per-page="perPage"
                            size="sm"
                            align="fill"
                            class="sub-details"
                        ></b-pagination>
                    </div>
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
import keyParams from "@/utils/keyParams";
import DataDownload from "@/components/DataDownload";
export default Vue.component("clumped-variants-table", {
    components: {
        DataDownload,
    },
    props: {
        variants: Array,
        phenotypeMap: Object,
        legends: Boolean,
        colors: Array,
    },
    data() {
        return {
            perPage: 10,
            currentPage: 1,
            subCurrentPage: {},
            fields: [
                {
                    key: "varId",
                    label: "Lead Variant(CHR:POS:REF:ALT)",
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
                    tdClass: "border-color",
                },
                {
                    key: "pValue",
                    label: "P-Value",
                    class: "pValue",
                },
                {
                    key: "effect_beta",
                    label: "Beta",
                },
                {
                    key: "effect_or",
                    label: "Odds Ratio",
                },
                { key: "view", label: "View LD Proxies" },
            ],
            subFields: [
                {
                    key: "varId",
                    label: "Variant(CHR:POS:REF:ALT)",
                },
                {
                    key: "dbSNP",
                    label: "dbSNP",
                },
                {
                    key: "pValue",
                    label: "P-Value",
                    tdClass: "pValue",
                },
            ],

            clumpData: {},
            loadingData: {},
        };
    },

    computed: {
        rows() {
            return this.variants.length;
        },
        maxPValue() {
            return this.variants[0].pValue;
        },
        groups() {
            return [...new Set(this.variants.map((v) => v.group))];
        },
        phenotypeGroups: function () {
            let groups = [];

            for (const [pKey, pValue] of Object.entries(this.phenotypeMap)) {
                groups.push(pValue.group);
            }

            groups = groups
                .filter(function (value, index, self) {
                    return self.indexOf(value) === index;
                })
                .sort();

            return groups;
        },
    },

    methods: {
        getColor(PGROUP) {
            let colorIndex = this.phenotypeGroups.indexOf(PGROUP);
            return this.colors[colorIndex];
        },
        async showClumpData(phenotype, clump, ancestry = "") {
            // Log phenotype-only data and phenotype-ancestry data in the same place.
            let queryIndex = `${phenotype},${ancestry}`;
            console.log(`Query index: ${queryIndex}`);
            if (this.clumpData[queryIndex] === undefined) {
                this.loadingData[queryIndex] = true;
                let clumpQuery =
                    ancestry == ""
                        ? await this.getClumpData(phenotype, clump)
                        : await this.getAncestryClumpData(
                              phenotype,
                              ancestry,
                              clump
                          );
                Vue.set(this.clumpData, queryIndex, clumpQuery);
                Vue.set(this.subCurrentPage, queryIndex, 1);
                this.loadingData[queryIndex] = false;
            }
        },
        async getClumpData(phenotype, clump) {
            return await query("clumped-variants", `${phenotype},${clump}`);
        },
        async getAncestryClumpData(phenotype, ancestry, clump) {
            return await query(
                "ancestry-clumped-variants",
                `${phenotype},${ancestry},${clump}`
            );
        },
        effectFields(phenotype) {
            if (this.phenotypeMap[phenotype]?.dichotomous)
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
        pValueFormatter(pValue) {
            return Formatters.pValueFormatter(pValue);
        },
        pValueCss(value) {
            return Formatters.pValueCss(value, this.maxPValue);
        },
        addPhenotype(phenotype) {
            this.$parent.$parent.pushCriterionPhenotype(phenotype);
            window.location.href = "#associations-table";
        },
        setPhenotype(phenotype) {
            this.$parent.$parent.setCriterionPhenotypes([phenotype]);
            window.location.href = "#associations-table";
        },
    },
});
</script>
<style>
@import url("/css/table.css");
#clump-data thead tr:hover,
#clump-data tr.b-table-details:hover {
    background-color: inherit;
}
#clump-data button.showData {
    min-width: 90px;
}
</style>
