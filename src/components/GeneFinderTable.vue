<template>
    <div>
        <div v-if="showPlot">
            <manhattan-plot
                :associations="combinedAssociations"
                style="margin-bottom: 10px"
            ></manhattan-plot>
            <center style="margin-bottom: 30px">
                <b v-show="!!this.showChiSquared"
                    >Combined P-Value(Χ²) across
                    <a
                        v-for="p in phenotypes"
                        class="item"
                        :href="`/phenotype.html?phenotype=${p}`"
                        >{{ phenotypeMap[p].description }}</a
                    >
                </b>
            </center>
        </div>

        <!--<div v-if="showPlot && mPlotData.length" class="egl-m-plot-wrapper">
            <effector-genes-m-plot
                :plotData="mPlotData"
                :locusKey="'region'"
                :scoreKey="'pValue'"
                :renderBy="'gene'"
                :yAxisLabel="'-log10(p)'"
                :popUpContent="['p-Value', 'region']"
            ></effector-genes-m-plot>
            <center style="margin-bottom: 30px">
                <b v-show="!!this.showChiSquared"
                    >Combined P-Value(Χ²) across
                    <a
                        v-for="p in phenotypes"
                        class="item"
                        :href="`/phenotype.html?phenotype=${p}`"
                        >{{ phenotypeMap[p].description }}</a
                    >
                </b>
            </center>
        </div>-->
        <div v-if="tableData.length > 0">
            <b-table
                hover
                small
                responsive="sm"
                :items="groupedAssociations"
                :fields="fields"
                :per-page="rowsPerPage"
                :current-page="currentPage"
            >
                <template v-slot:thead-top="data">
                    <b-th :colspan="!!showChiSquared ? 2 : 1">
                        <span
                            >Matching genes:
                            {{ groupedAssociations.length }}</span
                        >
                    </b-th>
                    <b-th
                        v-for="(phenotype, i) in phenotypes"
                        :key="phenotype"
                        colspan="3"
                        class="reference"
                        :class="'color-' + (i + 1)"
                    >
                        <span
                            v-if="phenotypeMap[phenotype]"
                            style="color: white"
                            >{{ phenotypeMap[phenotype].description
                            }}{{ ": " + genesPerPhenotypes[phenotype] }}</span
                        >
                    </b-th>
                </template>
                <template v-slot:cell(geneName)="r">
                    <a :href="`/gene.html?gene=${r.item.gene}`">
                        {{ r.item.gene }}
                    </a>
                </template>
                <template
                    v-slot:[phenotypePValueColumn(p)]="r"
                    v-for="p in phenotypes"
                    >{{ pValueFormatter(r.item[`${p}:pValue`]) }}</template
                >
                <template
                    v-slot:[phenotypeVariantsColumn(p)]="r"
                    v-for="p in phenotypes"
                    >{{ intFormatter(r.item[`${p}:nParam`]) }}</template
                >
                <template
                    v-slot:[phenotypeSubjectsColumn(p)]="r"
                    v-for="p in phenotypes"
                    >{{ intFormatter(r.item[`${p}:subjects`]) }}</template
                >
            </b-table>
            <b-pagination
                class="pagination-sm justify-content-center"
                v-model="currentPage"
                :total-rows="groupedAssociations.length"
                :per-page="rowsPerPage"
            ></b-pagination>
        </div>
        <div v-else>
            <h4 v-if="associations.length > 0">No overlapping associations</h4>
            <h4 v-else>No associations</h4>
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";

import VueTypeaheadBootstrap from "vue-typeahead-bootstrap";
import ManhattanPlot from "@/components/ManhattanPlot.vue";
import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import Chi from "chi-squared";
import Formatters from "@/utils/formatters";
import Filters from "@/utils/filters";

import EffectorGenesMPlot from "@/components/eglt/EffectorGenesMPlot";

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
        "exclusive",
        "showPlot",
        "showChiSquared",
        "rowsPerPage",
    ],
    components: {
        Documentation,
        TooltipDocumentation,

        EffectorGenesMPlot,
    },
    data() {
        return {
            currentPage: 1,
            baseFields: [
                {
                    key: "geneName",
                    label: "Gene",
                },
            ],
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

            // add the chi squared column
            if (!!this.showChiSquared) {
                fields.push({
                    key: "chiSquared",
                    label: "P-Value(Χ²)",
                    formatter: this.pValueFormatter,
                });
            }

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
                        },
                    },
                    {
                        key: `${p}:nParam`,
                        label: "Variants",
                    },
                    {
                        key: `${p}:subjects`,
                        label: "Samples",
                    },
                ]);
            }

            return fields;
        },

        groupedAssociations() {
            let data = [];
            let groups = {};
            let associations = this.tableData;

            //console.log("this.tableData.length", this.tableData);

            for (let i in associations) {
                let r = associations[i];
                let dataIndex = groups[r.gene];

                if (!dataIndex) {
                    dataIndex = data.length;
                    groups[r.gene] = dataIndex;

                    data.push({
                        phenotype: r.phenotype,
                        gene: r.gene,
                        chromosome: r.chromosome,
                        start: r.start,
                        end: r.end,
                        minP: 1.0,
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

                data = data.filter((row) => {
                    return phenotypes.every((p) => !!row[`${p}:pValue`]);
                });
            }

            // calculate the chiSquared for each row
            data.forEach((r) => (r.chiSquared = this.chiSquared(r)));

            // sort all the records by combined p-value
            data.sort((a, b) => a.chiSquared - b.chiSquared);

            return data;
        },

        genesPerPhenotypes() {
            let content = {};
            let data = this.tableData;
            let phenotypes = this.phenotypes;

            phenotypes.map((p) => {
                content[p] = 0;
            });
            data.map((g) => {
                content[g.phenotype]++;
            });

            return content;
        },

        combinedAssociations() {
            console.log(this.groupedAssociations);
            return this.groupedAssociations.map((a) => {
                return {
                    pValue: a.chiSquared,
                    chromosome: a.chromosome,
                    position: (a.start + a.end) / 2,
                };
            });
        },

        mPlotData() {
            return this.groupedAssociations.map((a) => {
                return {
                    pValue: -Math.log10(a.chiSquared),
                    "p-Value": this.pValueFormatter(a.chiSquared),
                    region: a.chromosome + ":" + a.start + "-" + a.end,
                    gene: a.gene,
                };
            });
        },
    },

    methods: {
        intFormatter: Formatters.intFormatter,
        floatFormatter: Formatters.floatFormatter,
        pValueFormatter: Formatters.pValueFormatter,

        phenotypePValueColumn(phenotype) {
            return `cell(${phenotype}:pValue)`;
        },

        phenotypeVariantsColumn(phenotype) {
            return `cell(${phenotype}:nParam)`;
        },

        phenotypeSubjectsColumn(phenotype) {
            return `cell(${phenotype}:subjects)`;
        },

        chiSquared(row) {
            let X = 0.0;

            for (let i in this.phenotypes) {
                let p = row[`${this.phenotypes[i]}:pValue`];

                if (!!p) {
                    X += -2 * Math.log(p);
                }
            }

            // calculate the combined p-value
            let pdf = Chi.pdf(X, 2 * this.phenotypes.length);

            return 2 * pdf;
        },
    },
});
</script>

<style>
@import url("/css/effectorGenes.css");
</style>
