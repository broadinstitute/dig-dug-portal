<template>
    <div id="clump-data">
        <b-row>
            <b-col v-if="legends" cols="9">
                <div
                    v-for="group in groups"
                    :key="group"
                    class="pws-group-legend"
                >
                    <div
                        class="pws-group-legend-box phenotype-group"
                        :class="group"
                    >
                        &nbsp;
                    </div>
                    {{ group }}
                </div>
            </b-col>
            <b-col class="text-right">
                <csv-download
                    :data="variants"
                    filename="clumped-variants"
                ></csv-download
            ></b-col>
        </b-row>
        <div class="text-right mb-2"></div>
        <div v-if="rows > 0">
            <b-table
                small
                hover
                responsive="sm"
                :items="variants"
                :fields="fields"
                :per-page="perPage"
                :current-page="currentPage"
                ><template #cell(varId)="data">
                    <a :href="`/variant.html?variant=${data.item.varId}`">{{
                        data.item.varId
                    }}</a>
                </template>
                <template #cell(dbSNP)="data">
                    <a :href="`/variant.html?variant=${data.item.dbSNP}`">{{
                        data.item.dbSNP
                    }}</a>
                </template>
                <template #cell(description)="data">
                    <a :id="data.item.phenotype" style="cursor: help">{{
                        data.item.description
                    }}</a>
                    <b-popover
                        :target="data.item.phenotype"
                        triggers="hover"
                        placement="top"
                    >
                        <b-list-group flush>
                            <b-list-group-item
                                href="#"
                                @click="addPhenotype(data.item.phenotype)"
                                >Add this phenotype to GEM</b-list-group-item
                            >
                            <b-list-group-item
                                href="#"
                                @click="setPhenotype(data.item.phenotype)"
                                >Set GEM to this phenotype</b-list-group-item
                            >
                            <b-list-group-item
                                :href="`/phenotype.html?phenotype=${data.item.phenotype}`"
                                >Go to phenotype page</b-list-group-item
                            >
                        </b-list-group>
                    </b-popover>
                </template>
                <template #cell(group)="data">
                    <div class="border-color" :class="data.item.group">
                        {{ data.item.group }}
                    </div>
                </template>
                <template #cell(pValue)="data">
                    <div
                        class="pValue"
                        :style="`background-size: ${pValueCss(
                            data.item.pValue
                        )}% 100%`"
                    >
                        {{ data.item.pValue }}
                    </div>
                </template>
                <template #cell(view)="data">
                    <b-button
                        size="sm"
                        variant="outline-primary"
                        class="btn-mini showData"
                        @click="
                            showClumpData(data.item.phenotype, data.item.clump);
                            data.toggleDetails();
                        "
                        ><span v-if="!!loadingData[data.item.phenotype]"
                            ><b-spinner small></b-spinner>
                            <span class="sr-only">Loading...</span></span
                        ><span v-else>
                            {{ data.detailsShowing ? "Hide" : "Show" }}
                            Variants</span
                        >
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
                    <div class="details">
                        <b-table
                            v-if="clumpData[row.item.phenotype]"
                            :items="clumpData[row.item.phenotype]"
                            :per-page="perPage"
                            :fields="effectFields(row.item.phenotype)"
                            :current-page="subCurrentPage[row.item.phenotype]"
                            ><template #cell(varId)="data">
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
                                    >{{
                                        data.item.beta < 0
                                            ? "&#9660;"
                                            : "&#9650;"
                                    }}</span
                                ><span
                                    v-if="
                                        !phenotypeMap[data.item.phenotype]
                                            .dichotomous
                                    "
                                    >{{ effectFormatter(data.item.beta) }}</span
                                >
                                <span v-else>{{
                                    effectFormatter(Math.exp(data.item.beta))
                                }}</span>
                            </template>
                        </b-table>
                        <b-pagination
                            v-if="clumpData[row.item.phenotype]"
                            v-model="subCurrentPage[row.item.phenotype]"
                            :total-rows="clumpData[row.item.phenotype].length"
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

export default Vue.component("clumped-variants-table", {
    props: { variants: Array, phenotypeMap: Object, legends: Boolean },
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
                { key: "view", label: "View Clump Data" },
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
    },

    methods: {
        async showClumpData(phenotype, clump) {
            if (this.clumpData[phenotype] === undefined) {
                this.loadingData[phenotype] = true;
                let clumpQuery = await this.getClumpData(phenotype, clump);
                Vue.set(this.clumpData, phenotype, clumpQuery);
                Vue.set(this.subCurrentPage, phenotype, 1);
                this.loadingData[phenotype] = false;
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
#clump-data thead tr:hover,
#clump-data tr.b-table-details:hover {
    background-color: inherit;
}
#clump-data button.showData {
    min-width: 90px;
}
.b-table-details div.details {
    margin-left: 20px;
    margin-bottom: 10px;
    padding-left: 10px;
    padding-bottom: 10px;
    border-left: 5px solid #eeeeee;
    border-bottom: 15px solid #eeeeee;
    background-color: #fcfcfc;
}
.b-table-details div.details ul {
    margin: 0 3rem 0 auto;
}
.b-table-details div.details .page-link {
    border: transparent !important;
}
.b-table-details div.details .page-item.disabled,
.b-table-details div.details .page-link {
    background-color: transparent;
}
.b-table-details div.details .page-item:not(.active) .page-link:hover {
    background-color: #eee;
}
div.details .sub-details {
    border: unset;
    border-radius: unset;
    border-bottom: 3px solid #eee;
}
.b-popover {
    background-color: #000;
}
.b-popover .popover-body a.list-group-item {
    padding: 0.125rem 0.5rem;
    background-color: #000000;
    color: #ffffff !important;
}
.b-popover .popover-body a.list-group-item:hover {
    background-color: #fcfcfc;
    color: blue !important;
}
.bs-popover-top > .arrow::after,
.bs-popover-auto[x-placement^="top"] > .arrow::after {
    border-top-color: #000000;
}

.sub-details .page-item.active .page-link,
.sub-details .page-item .page-link {
    border-radius: unset;
    font-size: 0.75rem;
    color: #52a549;
}
.sub-details .page-item.active .page-link {
    background-color: #4b9742;
    color: #fff;
    border-color: transparent;
}
.b-table div.pValue {
    width: 100%;
    height: 100%;
    background-image: url("/images/green_block.png");
    background-repeat: no-repeat;
    background-size: 100% 100%;
    background-position: left;
}
.table-sm td.border-color,
.table-sm td.pValue {
    padding: 0;
    height: auto;
    min-height: 1px;
    vertical-align: middle;
}
td.border-color > div {
    border-left-width: 5px;
    border-left-style: solid;
    border-color: #eeeeee;
    height: 100%;
    padding: 0.3rem;
}
</style>
