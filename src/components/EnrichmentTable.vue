<template>
    <div>
        <div v-if="rows > 0">
            <div class="text-right mb-2">
                <data-download
                    :data="tableData"
                    filename="enriched_annotations"
                ></data-download>
            </div>
            <b-table
                hover
                small
                responsive="sm"
                :items="tableData"
                :fields="fields"
                :sort-by="sortBy"
                :per-page="perPage"
                :current-page="currentPage"
                :sort-null-last="true"
                :sortable="true"
                :no-sort-reset="true"
            >
                <template #thead-top="data">
                    <b-th colspan="3">
                        <span class="sr-only">Tissue</span>
                    </b-th>
                    <b-th
                        v-for="(phenotype, i) in phenotypes"
                        :key="phenotype.name"
                        colspan="2"
                        class="reference"
                        :class="'color-' + (i + 1)"
                    >
                        <span style="color: white">{{
                            phenotype.description
                        }}</span>
                    </b-th>
                </template>
                <template #cell(tissue)="r">
                    <a
                        :href="`/tissue.html?tissue=${toSnakeFormatter(
                            r.item.tissue
                        )}`"
                    >
                        {{ tissueFormatter(r.item.tissue) }}
                    </a>
                </template>
            </b-table>
            <b-pagination
                v-model="currentPage"
                class="pagination-sm justify-content-center"
                :total-rows="rows"
                :per-page="perPage"
            ></b-pagination>
        </div>
        <div v-else>
            <h4 v-if="annotations.length > 0">
                No overlapping annotations found
            </h4>
            <div v-else>
                <b-alert show variant="warning" class="text-center">
                    <b-icon icon="exclamation-triangle"></b-icon> No data
                    available for this query.
                </b-alert>
            </div>
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import c3 from "c3";

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import Formatters from "@/utils/formatters";
import DataDownload from "@/components/DataDownload";

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import { decodeNamespace } from "@/utils/filterHelpers";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

export default Vue.component("EnrichmentTable", {
    props: ["phenotypes", "annotations", "filter"],
    component: { DataDownload },
    data() {
        return {
            perPage: 10,
            currentPage: 1,
            baseFields: [
                {
                    key: "tissue",
                    label: "Tissue",
                    formatter: Formatters.tissueFormatter,
                },
                {
                    key: "annotation",
                    label: "Annotation",
                    formatter: Formatters.annotationFormatter,
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
                        //, tdClass(x) { return !!x && x < 1e-5 ? "variant-table-cell high" : "";},
                        sortable: true,
                    },
                    {
                        key: `${p.name}_fold`,
                        label: `Fold`,
                        formatter: Formatters.floatFormatter,
                        tdClass(x) {
                            return !!x && x > 2
                                ? "variant-table-cell high"
                                : "";
                        },
                        sortable: true
                    },
                ]);
            }

            return fields;
        },
        sortBy() {
            return this.phenotypes[0].name + "_pValue" || "";
        },

        rows() {
            return this.tableData.length;
        },

        groupedAnnotations() {
            let data = [];
            let groups = {};
            let annotations = this.annotations;
            // get all the data from all phenotypes
            for (let i in annotations) {
                let r = annotations[i];
                if (r.pValue) {
                    let group = `${r.tissue}___${r.annotation}___${r.ancestry}`;
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
                            minP: r.pValue,
                            maxFold: fold,
                            phenotype: r.phenotype,
                        });
                    }

                    // add the columns for each phenotype
                    data[dataIndex][`${r.phenotype}_pValue`] = r.pValue;
                    data[dataIndex][`${r.phenotype}_fold`] = fold;

                    // lowest p-value across all phenotypes
                    if (r.pValue) {
                        let minP = data[dataIndex].minP;

                        if (r.pValue < minP) {
                            data[dataIndex].minP = r.pValue;
                        }
                    }

                    // maximum fold across all phenotypes
                    if (fold > data[dataIndex].maxFold) {
                        data[dataIndex].maxFold = fold;
                    }
                }
            }

            // sort all the records by phenotype fold
            data.sort((a, b) => b.maxFold - a.maxFold);

            return data;
        },
        tableData() {
            let filter = this.filter; // TODO: can we detect if not id=>true
            let dataRows = this.groupedAnnotations;

            if (filter) {
                dataRows = dataRows.filter((row) => {
                    const regularizedRow = decodeNamespace(row, {
                        prefix: `${row.phenotype}_`,
                    });
                    return filter(regularizedRow);
                });
            }
            return dataRows;
        },
    },
    methods: {
        tissueFormatter: Formatters.tissueFormatter,
        toSnakeFormatter: Formatters.toSnakeFormatter,
    },
});
</script>
