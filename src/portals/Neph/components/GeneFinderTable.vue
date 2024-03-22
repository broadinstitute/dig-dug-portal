<template>
    <div>
        <div v-show="showPlot">
            <manhattan-plot
                :associations="combinedAssociations"
                :phenotypes="phenotypes"
                :phenotypeMap="phenotypeMap"
                :colorByPhenotype="true"
                style="margin-bottom: 10px"
            ></manhattan-plot>
            <center style="margin-bottom: 30px">
                <b v-show="!!this.showChiSquared">
                    Combined P-Value(Χ²) across
                    <a
                        v-for="p in phenotypes"
                        class="item"
                        :href="`/phenotype.html?phenotype=${p}`"
                    >{{ phenotypeMap[p].description }}</a>
                </b>
            </center>
        </div>

        <div v-if="tableData.length > 0">
            <div class="text-right mb-2">
                <csv-download :data="groupedAssociations" filename="gene_table"></csv-download>
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
                <template v-slot:thead-top="data">
                    <b-th :colspan="!!showChiSquared ? 2 : 1">
                        <span>
                            Matching genes:
                            {{ groupedAssociations.length }}
                        </span>
                    </b-th>
                    <b-th
                        v-for="(phenotype, i) in phenotypes"
                        :key="phenotype"
                        colspan="5"
                        class="reference"
                        :class="'color-' + (i + 1)"
                    >
                        <span v-if="phenotypeMap[phenotype]" style="color: white">
                            {{ phenotypeMap[phenotype].description
                            }}{{ ": " + genesPerPhenotypes[phenotype] }}
                        </span>
                    </b-th>
                </template>
                <template v-slot:cell(gene)="r">
                    <a :href="`/gene.html?gene=${r.item.gene}`">{{ r.item.gene }}</a>
                </template>
                <template
                    v-slot:[phenotypePValueColumn(p)]="r"
                    v-for="p in phenotypes"
                >{{ pValueFormatter(r.item[`${p}:pValue`]) }}</template>
                <!-- <template
                    v-slot:[phenotypeVariantsColumn(p)]="r"
                    v-for="p in phenotypes"
                >{{ intFormatter(r.item[`${p}:nParam`]) }}</template>
                <template
                    v-slot:[phenotypeSubjectsColumn(p)]="r"
                    v-for="p in phenotypes"
                >{{ intFormatter(r.item[`${p}:subjects`]) }}</template> -->
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
import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import Chi from "chi-squared";
import Formatters from "@/utils/formatters";

import EffectorGenesMPlot from "@/components/eglt/EffectorGenesMPlot";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import Documentation from "@/components/Documentation";
import TooltipDocumentation from "@/components/TooltipDocumentation";
import CsvDownload from "@/components/CsvDownload";

export default Vue.component("gene-finder-table", {
    props: [
        "associations",
        "phenotypes",
        "phenotypeMap",
        "filter",
        "exclusive",
        "showPlot",
        "showChiSquared",
        "rowsPerPage"
    ],
    components: {
        Documentation,
        TooltipDocumentation,
        EffectorGenesMPlot,
        CsvDownload
    },
    data() {
        return {
            currentPage: 1,
            baseFields: [
                {
                    key: "gene",
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
            console.log(this.associations);
            return this.associations;
        },

        fields() {
            let fields = this.baseFields;

            // add the chi squared column
            if (!!this.showChiSquared) {
                fields.push({
                    key: "chiSquared",
                    label: "P-Value(Χ²)",
                    formatter: this.pValueFormatter
                });
            }

            // add phenotype-specific columns
            for (let i in this.phenotypes) {
                let p = this.phenotypes[i];
                //p = p.replace("HP-", "HP")

                fields = fields.concat([
                    {
                        key: `${p}:pValue`,
                        label: `P-Value`,
                        tdClass(x) {
                            return !!x && x < 1e-5
                                ? "variant-table-cell high text-right"
                                : "text-right";
                        },
                        sortable: true,
                        thClass: 'text-right',
                    },
                    {
                        key: `${p}:mask`,
                        label: "Mask"
                    },
                    {
                        key: `${p}:passingVariants`,
                        label: "Passing Variants",
                        thClass: 'text-right',
    				    tdClass: 'text-right',
                    },
                    {
                        key: `${p}:singleVariants`,
                        label: "Single Variants",
                        thClass: 'text-right',
    				    tdClass: 'text-right',
                    },
                    {
                        key: `${p}:af`,
                        label: "A1 Frequency",
                        thClass: 'text-right',
    				    tdClass: 'text-right',
                    }
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

                if (!(r.gene in groups)) {
                    dataIndex = data.length;
                    groups[r.gene] = dataIndex;
                    data.push({
                        phenotypes: [],
                        gene: r.gene,
                        chromosome: r.chromosome,
                        position: r.position,
                        minP: 1.0
                    });
                }

                // push the phenotype
                data[dataIndex].phenotypes.push(r.phenotype);

                

                // lowest p-value across all phenotypes
                if (!!r.pValue && r.pValue < data[dataIndex].minP) {
                    data[dataIndex].minP = r.pValue;
                    // add the phenotype columns
                    data[dataIndex][`${r.phenotype}:pValue`] = r.pValue;
                    data[dataIndex][`${r.phenotype}:mask`] = r.mask;
                    data[dataIndex][`${r.phenotype}:passingVariants`] = r.passingVariants;
                    data[dataIndex][`${r.phenotype}:singleVariants`] = r.singleVariants;
                    data[dataIndex][`${r.phenotype}:af`] = r.af;
                    data[dataIndex][`${r.phenotype}:sample_ID`] = r.sample_ID;
                }
            }

            // remove entries with missing p-values
            if (this.exclusive) {
                let phenotypes = this.phenotypes;

                data = data.filter(row => {
                    return phenotypes.every(p => !!row[`${p}:pValue`]);
                });
            }

            // calculate the chiSquared for each row
            data.forEach(r => (r.chiSquared = this.chiSquared(r)));

            // sort all the records by combined p-value
            data.sort((a, b) => a.chiSquared - b.chiSquared);

            return data;
        },

        genesPerPhenotypes() {
            let content = {};
            let data = this.tableData;
            let phenotypes = this.phenotypes;

            phenotypes.map(p => {
                content[p] = 0;
            });
            data.map(g => {
                content[g.phenotype]++;
            });

            return content;
        },

        combinedAssociations() {
            let groups = [];

            this.groupedAssociations.forEach(a => {
                a.phenotypes.forEach(phenotype => {
                    groups.push({
                        phenotype,
                        pValue: a[`${phenotype}:pValue`],
                        chromosome: a.chromosome,
                        position: Math.floor((a.start + a.end) / 2)
                    });
                });
            });

            return groups;
        }
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
        }
    }
});
</script>

<style>
@import url("/css/effectorGenes.css");
</style>
