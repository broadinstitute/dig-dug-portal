<template>
    <div>
        <b-container fluid class="filtering-ui-wrapper">
            <b-row class="filtering-ui-content">
                <span class="filter-by-label">Filter table by:</span>
                <b-col>
                    <div class="label">Annotation</div>
                    <b-form-select
                        @input="addFilter($event, 'select_annotations')"
                        :options="filter_annotation"
                        v-model="select_annotations_text"
                    ></b-form-select>
                </b-col>
                <b-col>
                    <div class="label">Method</div>
                    <b-form-select
                        @input="addFilter($event, 'select_methods')"
                        :options="filter_method"
                        v-model="select_methods_text"
                    ></b-form-select>
                </b-col>
                <b-col>
                    <div class="label">Tissue</div>
                    <b-form-select
                        @input="addFilter($event, 'select_tissues')"
                        :options="filter_tissue"
                        v-model="select_tissues_text"
                    ></b-form-select>
                </b-col>
                <b-col>
                    <div class="label">Ancestry:</div>
                    <b-form-select
                        @input="setFilter($event, 'select_ancestry')"
                        :options="filter_ancestry"
                        ref="select_ancestry"
                    ></b-form-select>
                </b-col>
                <b-col>
                    <div class="label">p-Value (&le;)</div>
                    <b-form-input
                        id="filter-pValue"
                        type="text"
                        @change="setFilter($event, 'select_pValue')"
                        ref="select_pValue"
                    ></b-form-input>
                </b-col>
                <b-col>
                    <div class="label">Effect</div>
                    <b-form-select
                        @input="setFilter($event, 'select_odds_ratio')"
                        :options="select_odds_ratio_options"
                        ref="select_odds_ratio"
                        v-model="select_odds_ratio"
                    ></b-form-select>
                </b-col>
            </b-row>
        </b-container>
        <b-container fluid class="selected-filters-ui-wrapper">
            <b-row>
                <b-col>
                    <span
                        v-if="select_annotations.length > 0 || select_methods.length > 0 || select_tissues.length > 0 || select_ancestry || select_pValue || select_odds_ratio"
                    >Selected Filters:&nbsp;&nbsp;</span>
                    <template v-if="select_annotations">
                        <b-badge
                            pill
                            variant="info"
                            v-for="(v,i) in select_annotations"
                            :key="v"
                            @click="removeFilter(i, 'select_annotations')"
                            class="btn"
                        >
                            {{v}}
                            <span class="remove">X</span>
                        </b-badge>
                    </template>
                    <template v-if="select_methods">
                        <b-badge
                            pill
                            variant="primary"
                            v-for="(v,i) in select_methods"
                            :key="v"
                            @click="removeFilter(i, 'select_methods')"
                            class="btn"
                        >
                            {{v}}
                            <span class="remove">X</span>
                        </b-badge>
                    </template>
                    <template v-if="select_tissues">
                        <b-badge
                            pill
                            variant="warning"
                            v-for="(v,i) in select_tissues"
                            :key="v"
                            @click="removeFilter(i, 'select_tissues')"
                            class="btn"
                        >
                            {{v}}
                            <span class="remove">X</span>
                        </b-badge>
                    </template>
                    <template v-if="select_ancestry">
                        <b-badge
                            pill
                            variant="success"
                            @click="unsetFilter('select_ancestry')"
                            class="btn"
                        >
                            {{select_ancestry}}
                            <span class="remove">X</span>
                        </b-badge>
                    </template>
                    <template v-if="select_pValue">
                        <b-badge
                            pill
                            variant="danger"
                            @click="unsetFilter('select_pValue')"
                            class="btn"
                        >
                            {{select_pValue}}
                            <span class="remove">X</span>
                        </b-badge>
                    </template>
                    <template v-if="select_odds_ratio">
                        <b-badge
                            pill
                            variant="danger"
                            @click="unsetFilter('select_odds_ratio')"
                            class="btn"
                        >
                            {{select_odds_ratio_options.find(e => e.value == select_odds_ratio).text}}
                            <span
                                class="remove"
                            >X</span>
                        </b-badge>
                    </template>
                </b-col>
            </b-row>
        </b-container>

        <div v-if="rows > 0">
            <b-table
                hover
                small
                responsive="sm"
                :items="tableData"
                :fields="fields"
                :per-page="perPage"
                :current-page="currentPage"
            >
                <template v-slot:thead-top="data">
                    <b-th colspan="4">
                        <span class="sr-only">Tissue</span>
                    </b-th>
                    <b-th
                        :key="phenotype.name"
                        v-for="(phenotype, i) in phenotypes"
                        colspan="3"
                        class="reference"
                        :class="'color-' + (i+1)"
                    >
                        <span style="color:white">{{phenotype.description}}</span>
                    </b-th>
                </template>
            </b-table>
            <b-pagination
                class="pagination-sm justify-content-center"
                v-model="currentPage"
                :total-rows="rows"
                :per-page="perPage"
            ></b-pagination>
        </div>
        <div v-else>
            <h4 v-if="annotations.length > 0">No overlapping annotations found</h4>
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import c3 from "c3";

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import Formatters from "@/utils/formatters";
import Filters from "@/utils/filters";

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

export default Vue.component("enrichment-table", {
    props: ["phenotypes", "annotations"],

    data() {
        return {
            perPage: 10,
            currentPage: 1,
            baseFields: [
                {
                    key: "annotation",
                    label: "Annotation",
                    formatter: Formatters.annotationFormatter
                },
                {
                    key: "method",
                    label: "Method",
                    formatter: Formatters.capitalizedFormatter
                },
                {
                    key: "tissue",
                    label: "Tissue",
                    formatter: Formatters.tissueFormatter
                },
                {
                    key: "ancestry",
                    label: "Ancestry",
                    formatter: Formatters.ancestryFormatter
                }
            ],
            select_annotations: [],
            select_annotations_text: "",
            select_methods: [],
            select_methods_text: "",
            select_tissues: [],
            select_tissues_text: "",
            select_ancestry: "",
            select_pValue: "",
            select_odds_ratio: "",
            select_odds_ratio_options: [
                { value: "", text: "All" },
                { value: "p", text: "Positive" },
                { value: "n", text: "Negative" }
            ]
        };
    },

    computed: {
        fields() {
            let fields = this.baseFields;

            for (let i in this.phenotypes) {
                let p = this.phenotypes[i];

                fields = fields.concat([
                    {
                        key: `${p.name}_pValue`,
                        label: `P-Value`,
                        formatter: Formatters.floatFormatter,
                        tdClass(x) {
                            return !!x && x < 1e-5
                                ? "variant-table-cell high"
                                : "";
                        }
                    },
                    {
                        key: `${p.name}_beta`,
                        label: !!p.dichotomous ? "Odds Ratio" : "Beta",
                        formatter: x => {
                            if (p.dichotomous) {
                                x = Math.exp(x);
                            }

                            return Formatters.floatFormatter(x);
                        }
                    },
                    {
                        key: `${p.name}_SNPs`,
                        label: `SNPs`,
                        formatter: Formatters.intFormatter,
                        sortable: true
                    }
                ]);
            }

            return fields;
        },

        rows() {
            return this.tableData.length;
        },

        groupedAnnotations() {
            let data = [];
            let groups = {};

            // get all the data from all phenotypes
            for (let i in this.annotations) {
                let r = this.annotations[i];
                let t = !!r.tissue ? r.tissue.id : "NA";
                let m = r.method || "NA";
                let group = `${t}_${m}_${r.annotation}_${r.ancestry}`;
                let dataIndex = groups[group];

                if (!dataIndex) {
                    dataIndex = data.length;
                    groups[group] = dataIndex;

                    data.push({
                        tissue: r.tissue,
                        method: r.method,
                        annotation: r.annotation,
                        ancestry: r.ancestry,
                        minP: 2.0
                    });
                }

                // add the columns for each phenotype
                data[dataIndex][`${r.phenotype}_expectedSNPs`] = r.expectedSNPs;
                data[dataIndex][`${r.phenotype}_SNPs`] = r.SNPs;
                data[dataIndex][`${r.phenotype}_pValue`] = r.pValue;
                data[dataIndex][`${r.phenotype}_beta`] = r.beta;

                // lowest p-value across all phenotypes
                if (!!r.pValue && r.pValue < data[dataIndex].minP) {
                    data[dataIndex].minP = r.pValue;
                }
            }

            // remove non-overlapping enrichment
            data = data.filter(row => {
                for (let i in this.phenotypes) {
                    let phenotype = this.phenotypes[i];

                    // ensure a p-value exists for each phenotype
                    if (!row[`${phenotype.name}_pValue`]) {
                        return false;
                    }
                }

                return true;
            });

            // sort all the records by phenotype p-value
            data.sort((a, b) => a.minP - b.minP);

            return data;
        },
        filter_annotation() {
            return this.groupedAnnotations
                .map(v => Formatters.annotationFormatter(v.annotation))
                .filter((v, i, arr) => arr.indexOf(v) == i);
        },
        filter_method() {
            return this.groupedAnnotations
                .map(v => Formatters.capitalizedFormatter(v.method))
                .filter((v, i, arr) => arr.indexOf(v) == i)
                .filter((v, i, arr) => v != undefined);
        },
        filter_tissue() {
            return this.groupedAnnotations
                .map(v => Formatters.tissueFormatter(v.tissue))
                .filter((v, i, arr) => arr.indexOf(v) == i)
                .filter((v, i, arr) => v != undefined)
                .filter((v, i, arr) => v != "-");
        },
        filter_ancestry() {
            return this.groupedAnnotations
                .map(v => Formatters.ancestryFormatter(v.ancestry))
                .filter((v, i, arr) => arr.indexOf(v) == i);
        },
        tableData() {
            let dataRows = this.groupedAnnotations;
            if (this.select_annotations.length > 0) {
                dataRows = Filters.filterFormatted(
                    dataRows,
                    this.select_annotations,
                    "annotation"
                );
            }
            if (this.select_methods.length > 0) {
                dataRows = Filters.filterFormatted(
                    dataRows,
                    this.select_methods,
                    "method"
                );
            }
            if (this.select_tissues.length > 0) {
                dataRows = Filters.filterFormatted(
                    dataRows,
                    this.select_tissues,
                    "tissue"
                );
            }
            if (this.select_ancestry != "") {
                dataRows = Filters.filterFormatted(
                    dataRows,
                    this.select_ancestry,
                    "ancestry"
                );
            }
            if (this.select_pValue != "") {
                dataRows = Filters.filterPValue(
                    dataRows,
                    this.select_pValue,
                    `${this.phenotypes[0].name}_pValue`
                );
            }
            if (this.select_odds_ratio != "") {
                dataRows = Filters.filterBeta(
                    dataRows,
                    this.select_odds_ratio,
                    `${this.phenotypes[0].name}_beta`
                );
            }
            return dataRows;
        }
    },
    methods: {
        addFilter(event, obj) {
            this[obj].push(event);
            this[obj + "_text"] = "";
        },
        removeFilter(index, obj) {
            this[obj].splice(index, 1);
        },
        setFilter(event, obj) {
            this[obj] = event;
            this.$refs[obj].$el.value = "";
        },
        unsetFilter(obj) {
            this[obj] = "";
        }
    }
});
</script>
