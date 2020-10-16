<template>
    <div>
        <div>
            <div v-if="tableData.length > 0">
                <b-table
                    hover
                    small
                    responsive="sm"
                    :items="groupedAssociations"
                    :fields="fields"
                    :per-page="perPage"
                    :current-page="currentPage"
                >
                    <template v-slot:thead-top="data">
                        <b-th colspan="1">
                            <span class="sr-only">Gene</span>
                        </b-th>
                        <b-th
                            v-for="(phenotype, i) in phenotypes"
                            :key="phenotype"
                            colspan="3"
                            class="reference"
                            :class="'color-' + (i + 1)"
                        >
                            <span v-if="phenotypeMap[phenotype]" style="color: white">
                                {{
                                phenotypeMap[phenotype].description
                                }}
                            </span>
                        </b-th>
                    </template>
                    <template v-slot:cell(geneName)="r">
                        <a :href="`/gene.html?gene=${r.item.gene}`">
                            {{
                            r.item.gene
                            }}
                        </a>
                    </template>
                    <template
                        v-slot:[phenotypePValueColumn(p)]="r"
                        v-for="p in phenotypes"
                    >{{ pValueFormatter(r.item[`${p}:pValue`]) }}</template>
                    <template
                        v-slot:[phenotypeVariantsColumn(p)]="r"
                        v-for="p in phenotypes"
                    >{{ intFormatter(r.item[`${p}:nParam`]) }}</template>
                    <template
                        v-slot:[phenotypeSubjectsColumn(p)]="r"
                        v-for="p in phenotypes"
                    >{{ intFormatter(r.item[`${p}:subjects`]) }}</template>
                </b-table>
                <b-pagination
                    class="pagination-sm justify-content-center"
                    v-model="currentPage"
                    :total-rows="tableData.length"
                    :per-page="perPage"
                ></b-pagination>
            </div>
            <div v-else>
                <h4 v-if="associations.length > 0">No overlapping associations</h4>
                <h4 v-else>No associations</h4>
            </div>
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";

import VueTypeaheadBootstrap from "vue-typeahead-bootstrap";
import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import Formatters from "@/utils/formatters";
import Filters from "@/utils/filters";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import Documentation from "@/components/Documentation";
import TooltipDocumentation from "@/components/TooltipDocumentation";

export default Vue.component("gene-finder-table", {
    props: [
        "associations",
        "phenotypes",
        "phenotypeMap",
        "filter",
        "exclusive"
    ],
    components: {
        Documentation,
        TooltipDocumentation
    },
    data() {
        return {
            perPage: 10,
            currentPage: 1,
            baseFields: [
                {
                    key: "geneName",
                    label: "Gene"
                }
            ]
        };
    },

    computed: {
        rows() {
            return this.tableData.length;
        },

        tableData() {
            if (!!this.filter) {
                return this.associations.filter(this.filter);
            }
            return this.associations;
        },

        fields() {
            let fields = this.baseFields;

            // add phenotype-specific columns
            for (let i in this.phenotypes) {
                let p = this.phenotypes[i];

                fields = fields.concat([
                    {
                        key: `${p}:pValue`,
                        label: `P-Value`,
                        tdClass(x) {
                            return !!x && x < 1e-5
                                ? "variant-table-cell high"
                                : "";
                        }
                    },
                    {
                        key: `${p}:nParam`,
                        label: "Variants"
                    },
                    {
                        key: `${p}:subjects`,
                        label: "Samples"
                    }
                ]);
            }

            return fields;
        },

        groupedAssociations() {
            let data = [];
            let groups = {};
            let associations = this.tableData;

            for (let i in associations) {
                let r = associations[i];
                let dataIndex = groups[r.gene];

                if (!dataIndex) {
                    dataIndex = data.length;
                    groups[r.gene] = dataIndex;

                    data.push({
                        phenotype: r.phenotype,
                        gene: r.gene,
                        minP: 1.0
                    });
                }

                // add the phenotype columns
                data[dataIndex][`${r.phenotype}:pValue`] = r.pValue;
                data[dataIndex][`${r.phenotype}:zStat`] = r.zStat;
                data[dataIndex][`${r.phenotype}:nParam`] = r.nParam;
                data[dataIndex][`${r.phenotype}:subjects`] = r.subjects;

                // lowest p-value across all phenotypes
                if (!!r.pValue && r.pValue < data[dataIndex].minP) {
                    data[dataIndex].minP = r.pValue;
                }
            }

            // remove entries with missing p-values
            if (this.exclusive) {
                let phenotypes = this.phenotypes;

                data = data.filter(row => {
                    return phenotypes.every(p => !!row[`${p}:pValue`]);
                });
            }

            // sort all the records by phenotype p-value
            data.sort((a, b) => a.minP - b.minP);

            return data;
        }
    },

    methods: {
        intFormatter: Formatters.intFormatter,
        pValueFormatter: Formatters.pValueFormatter,

        phenotypePValueColumn(phenotype) {
            return `cell(${phenotype}:pValue)`;
        },

        phenotypeVariantsColumn(phenotype) {
            return `cell(${phenotype}:nParam)`;
        },

        phenotypeSubjectsColumn(phenotype) {
            return `cell(${phenotype}:subjects)`;
        }
    }
});
</script>
