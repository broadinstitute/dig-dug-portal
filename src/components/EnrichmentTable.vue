<template>
    <div>
        <div v-if="rows > 0">
            <b-container class="filter_rows" fluid>
                <b-row>
                    <b-col>
                        <b-form-select
                            v-model="select_annotations"
                            :options="filter_annotation"
                            multiple
                        >
                            <b-form-select-option value>Select a filter</b-form-select-option>
                        </b-form-select>
                    </b-col>
                    <b-col>
                        <b-form-select v-model="select_methods" :options="filter_method" multiple>
                            <b-form-select-option value>Select a filter</b-form-select-option>
                        </b-form-select>
                    </b-col>
                    <b-col>
                        <b-form-select v-model="select_tissues" :options="filter_tissue" multiple>
                            <b-form-select-option value>Select a filter</b-form-select-option>
                        </b-form-select>
                    </b-col>
                    <b-col>
                        <b-form-select v-model="select_ancestry" :options="filter_ancestry">
                            <b-form-select-option value>Select a filter</b-form-select-option>
                        </b-form-select>
                    </b-col>
                    <b-col>
                        <b-form-input
                            id="filter-pValue"
                            type="number"
                            v-model="select_pValue"
                            placeholder="Filter pValue <="
                        ></b-form-input>
                    </b-col>
                    <b-col>
                        <b-form-input
                            id="filter-beta"
                            type="number"
                            v-model="select_beta"
                            placeholder="Filter Beta"
                        ></b-form-input>
                    </b-col>
                </b-row>
            </b-container>
        </div>
        <div v-if="rows > 0">
            <b-table
                hover
                small
                responsive="sm"
                :items="groupedAnnotations"
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
                        colspan="2"
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
            select_methods: [],
            select_tissues: [],
            select_ancestry: "",
            select_pValue: "",
            select_beta: ""
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
            return this.groupedAnnotations.length;
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
                .filter((v, i, arr) => v != undefined);
        },
        filter_ancestry() {
            return this.groupedAnnotations
                .map(v => Formatters.ancestryFormatter(v.ancestry))
                .filter((v, i, arr) => arr.indexOf(v) == i);
        }
    }
});
</script>
