<template>
    <div>
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
import Filters from "@/utils/filters";

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import { decodeNamespace } from "@/utils/filterHelpers"

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

export default Vue.component("enrichment-table", {
    props: ["phenotypes", "annotations", "filter"],

    data() {
        return {
            perPage: 10,
            currentPage: 1,
            baseFields: [
                {
                    key: "annotation",
                    label: "Annotation",
                    formatter: Formatters.annotationFormatter,
                },
                {
                    key: "method",
                    label: "Method",
                    formatter: Formatters.methodFormatter,
                },
                {
                    key: "tissue",
                    label: "Tissue",
                    formatter: Formatters.tissueFormatter,
                },
                {
                    key: "ancestry",
                    label: "Ancestry",
                    formatter: Formatters.ancestryFormatter,
                },
            ],
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
                        formatter: Formatters.pValueFormatter,
                        tdClass(x) {
                            return !!x && x < 1e-5
                                ? "variant-table-cell high"
                                : "";
                        },
                    },
                    {
                        key: `${p.name}_fold`,
                        label: `Fold`,
                        formatter: Formatters.floatFormatter,
                    },
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
            let annotations = this.tableData
            // get all the data from all phenotypes
            for (let i in annotations) {
                let r = annotations[i];
                if (!!r.pValue) {
                    let t = r.tissueId || "NA";
                    let m = r.method || "NA";
                    let group = `${t}_${m}_${r.annotation}_${r.ancestry}`;
                    let dataIndex = groups[group];
                    let fold = r.SNPs / r.expectedSNPs;

                    if (!dataIndex) {
                        dataIndex = data.length;
                        groups[group] = dataIndex;

                        data.push({
                            tissue: r.tissue,
                            method: r.method,
                            annotation: r.annotation,
                            ancestry: r.ancestry,
                            minP: null,
                            maxFold: null,
                            phenotype: r.phenotype
                        });
                    }

                    // add the columns for each phenotype
                    data[dataIndex][`${r.phenotype}_pValue`] = r.pValue;
                    data[dataIndex][`${r.phenotype}_fold`] = fold;

                    // lowest p-value across all phenotypes
                    if (r.pValue) {
                        let minP = data[dataIndex].minP;

                        if (!minP || r.pValue < minP) {
                            data[dataIndex].minP = r.pValue;
                        }
                    }

                    // maximum fold across all phenotypes
                    let maxFold = data[dataIndex].maxFold;

                    if (!maxFold || fold > maxFold) {
                        data[dataIndex].maxFold = fold;
                    }
                }
            }

            // remove non-overlapping enrichment
            // REMOVED because double loop
            // data = data.filter((row) => {
            //     for (let i in this.phenotypes) {
            //         let phenotype = this.phenotypes[i];

            //         // ensure a p-value exists for each phenotype
            //         if (!row[`${phenotype.name}_pValue`]) {
            //             return false;
            //         }
            //     }

            //     return true;
            // });

            // sort all the records by phenotype p-value
            data.sort((a, b) => a.minP - b.minP);

            return data;
        },
        tableData() {
            let dataRows = this.annotations;
            let filter = this.filter;  // TODO: can we detect if not id=>true
            if (!!filter) {
                dataRows = dataRows.filter(filter);
            }
            return dataRows;
        },
    },
});
</script>
