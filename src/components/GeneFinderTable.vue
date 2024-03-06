<template>
    <div>
        <div v-show="showPlot">
            <research-m-plot
                :plotData="formatAssocData(tableData)"
                :renderConfig="assocPlotConfig"
            ></research-m-plot>
            <center style="margin-bottom: 30px">
                <b v-show="!!showChiSquared">
                    Combined P-Value(Χ²) across
                    <a
                        v-for="p in phenotypes"
                        class="item"
                        :href="`/phenotype.html?phenotype=${p}`"
                        >{{ phenotypeMap[p].description }}</a
                    >
                </b>
            </center>
        </div>
        <div v-if="tableData.length > 0">
            <div class="text-right mb-2">
                <data-download
                    :data="groupedAssociations"
                    filename="gene_table"
                ></data-download>
            </div>
            <b-table
                hover
                small
                responsive="sm"
                :items="groupedAssociations"
                :fields="fields"
                :per-page="rowsPerPage"
                :current-page="currentPage"
            >
                <template #thead-top="data">
                    <b-th :colspan="!!showChiSquared ? 2 : 1">
                        <span>
                            Matching genes:
                            {{ groupedAssociations.length }}
                        </span>
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
                        >
                            {{ phenotypeMap[phenotype].description
                            }}{{ ": " + genesPerPhenotypes[phenotype] }}
                        </span>
                    </b-th>
                </template>
                <template #cell(geneName)="r">
                    <a :href="`/gene.html?gene=${r.item.gene}`">{{
                        r.item.gene
                    }}</a>
                </template>
                <template
                    v-for="p in phenotypes"
                    #[phenotypePValueColumn(p)]="r"
                    >{{ pValueFormatter(r.item[`${p}:pValue`]) }}</template
                >
                <template
                    v-for="p in phenotypes"
                    #[phenotypeVariantsColumn(p)]="r"
                    >{{ intFormatter(r.item[`${p}:nParam`]) }}</template
                >
                <template
                    v-for="p in phenotypes"
                    #[phenotypeSubjectsColumn(p)]="r"
                    >{{ intFormatter(r.item[`${p}:subjects`]) }}</template
                >
            </b-table>
            <b-pagination
                v-model="currentPage"
                class="pagination-sm justify-content-center"
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
import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import Chi from "chi-squared";
import Formatters from "@/utils/formatters";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import DataDownload from "@/components/DataDownload";

export default Vue.component("GeneFinderTable", {
    components: {
        DataDownload,
    },
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
    data() {
        return {
            currentPage: 1,
            baseFields: [
                {
                    key: "geneName",
                    label: "Gene",
                },
            ],
            assocPlotConfig: {
                "type": "manhattan plot",
                "x axis field": "position",
                "y axis field": "minusLogP",
                "render by": "gene",
                "x axis label": "Position",
                "y axis label": "-log10(p-value)",
                "height": 300,
                "link to": "/region.html",
                "hover content": ["p"]
            }
        };
    },

    computed: {
        tableData() {
            if (this.filter) {
                return this.associations.filter(this.filter);
            }
            return this.associations;
        },

        fields() {
            let fields = this.baseFields;

            // add the chi squared column
            if (this.showChiSquared) {
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
                        sortable: true,
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

            for (let i in associations) {
                let r = associations[i];
                let dataIndex = groups[r.gene];

                if (!(r.gene in groups)) {
                    dataIndex = data.length;
                    groups[r.gene] = dataIndex;

                    data.push({
                        phenotypes: [],
                        gene: r.gene,
                        chromosome: r.chromosome,
                        start: r.start,
                        end: r.end,
                        minP: 1.0,
                    });
                }

                // push the phenotype
                data[dataIndex].phenotypes.push(r.phenotype);

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
    },

    methods: {
        intFormatter: Formatters.intFormatter,
        floatFormatter: Formatters.floatFormatter,
        pValueFormatter: Formatters.pValueFormatter,
        formatAssocData(assocData){
            assocData.forEach(entry => {
                entry.position = `${entry.chromosome} : ${entry.start} - ${entry.end}`;
                entry.minusLogP = -Math.log10(entry.pValue);
                entry.p = this.pValueFormatter(entry.pValue);
            });
            return assocData;
        },
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

                if (p) {
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
