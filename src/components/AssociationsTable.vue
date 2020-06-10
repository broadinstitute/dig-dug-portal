<template>
    <div>
        <div v-if="rows > 0">
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
                    <b-th colspan="5">
                        <span class="sr-only">Variant</span>
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
                <template v-slot:cell(locus)="r">
                    <a
                        :href="`/region.html?chr=${r.item.chromosome}&start=${r.item.position-50000}&end=${r.item.position+50000}`"
                    >{{locusFormatter(r.item)}}</a>
                </template>
                <template v-slot:cell(allele)="r">
                    <a :href="`/variant.html?variant=${r.item.varId}`">{{alleleFormatter(r.item)}}</a>
                </template>
                <template v-slot:cell(dbSNP)="r">
                    <a :href="`/variant.html?variant=${r.item.varId}`">{{dbSNPFormatter(r.item)}}</a>
                </template>
                <template v-slot:cell(symbol)="r">
                    <a :href="`/gene.html?gene=${r.item.gene}`">{{r.item.gene}}</a>
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
            <h4 v-if="associations.length > 0">No overlapping associations across phenotypes</h4>
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import Formatters from "@/utils/formatters";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

export default Vue.component("associations-table", {
    props: ["associations", "phenotypes"],
    data() {
        return {
            perPage: 10,
            currentPage: 1,
            baseFields: [
                {
                    key: "locus",
                    label: "Locus"
                },
                {
                    key: "allele",
                    label: "Allele"
                },
                {
                    key: "dbSNP",
                    label: "dbSNP"
                },
                {
                    key: "consequence",
                    label: "Consequence",
                    formatter: Formatters.consequenceFormatter
                },
                {
                    key: "symbol",
                    label: "Gene"
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
                        formatter: Formatters.pvalueFormatter,
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

                            return Formatters.betaOddsFormatter(x);
                        }
                    }
                ]);
            }

            return fields;
        },

        rows() {
            return this.groupedAssociations.length;
        },

        groupedAssociations() {
            let data = [];
            let groups = {};

            for (let i in this.associations) {
                let r = this.associations[i];
                let dataIndex = groups[r.varId];

                if (!dataIndex) {
                    dataIndex = data.length;
                    groups[r.varId] = dataIndex;

                    data.push({
                        varId: r.varId,
                        chromosome: r.chromosome,
                        position: r.position,
                        reference: r.reference,
                        dbSNP: r.dbSNP,
                        consequence: r.consequence,
                        gene: r.gene,
                        alt: r.alt,
                        minP: 1.0
                    });
                }

                // add the phenotype columns
                data[dataIndex][`${r.phenotype}_pValue`] = r.pValue;
                data[dataIndex][`${r.phenotype}_beta`] = r.beta;
                data[dataIndex][`${r.phenotype}_stdErr`] = r.stdErr;
                data[dataIndex][`${r.phenotype}_zScore`] = r.zScore;
                data[dataIndex][`${r.phenotype}_n`] = r.n;

                // lowest p-value across all phenotypes
                if (!!r.pValue && r.pValue < data[dataIndex].minP) {
                    data[dataIndex].minP = r.pValue;
                }
            }

            // remove non-overlapping associations
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
    },

    methods: {
        alleleFormatter({ reference, alt }) {
            return Formatters.alleleFormatter(reference, alt);
        },
        locusFormatter({ chromosome, position }) {
            return Formatters.locusFormatter(chromosome, position);
        },
        dbSNPFormatter({ dbSNP }) {
            return Formatters.dbSNPFormatter(dbSNP);
        }
    }
});
</script>
