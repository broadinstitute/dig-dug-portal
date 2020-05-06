<template>
    <div>
        <div v-if="rows > 0">
            <b-pagination
                class="pagination-sm justify-content-end"
                v-model="currentPage"
                :total-rows="rows"
                :per-page="perPage"
            ></b-pagination>
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
                    label: "Method"
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
                        key: `${p.name}_SNPs`,
                        label: `SNPs`,
                        formatter: Formatters.intFormatter
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
        }
    }
});
</script>
