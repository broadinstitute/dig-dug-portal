<template>
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
                    <b-th colspan="5">
                        <span class="sr-only">Variant</span>
                    </b-th>
                    <b-th
                        :key="phenotype.name"
                        v-for="(phenotype, i) in phenotypes"
                        colspan="2"
                        class="reference"
                        :class="'color-' + (i + 1)"
                    >
                        <span style="color: white">{{
                            phenotype.description
                        }}</span>
                    </b-th>
                </template>
                <template v-slot:cell(position)="r">
                    <a
                        :href="`/region.html?phenotype=${
                            phenotypes[0].name
                        }&chr=${r.item.chromosome}&start=${
                            r.item.position - 50000
                        }&end=${r.item.position + 50000}`"
                        >{{ locusFormatter(r.item) }}</a
                    >
                </template>
                <template v-slot:cell(allele)="r">
                    <a :href="`/variant.html?variant=${r.item.varId}`">{{
                        alleleFormatter(r.item)
                    }}</a>
                </template>
                <template v-slot:cell(dbSNP)="r">
                    <a :href="`/variant.html?variant=${r.item.varId}`">{{
                        dbSNPFormatter(r.item)
                    }}</a>
                </template>
                <template v-slot:cell(consequence)="r">{{
                    consequenceFormatter(r.item.consequence)
                }}</template>
                <template v-slot:cell(genes)="r">
                    <a
                        v-for="gene in r.item.nearest"
                        class="item"
                        :href="`/gene.html?gene=${gene}`"
                        >{{ gene }}</a
                    >
                </template>
                <template
                    v-slot:[phenotypeBetaColumn(p)]="r"
                    v-for="p in phenotypes"
                >
                    <span
                        :class="`effect ${
                            r.item[`${p.name}:beta`] < 0
                                ? 'negative'
                                : 'positive'
                        }`"
                        >{{
                            r.item[`${p.name}:beta`] < 0 ? "&#9660;" : "&#9650;"
                        }}</span
                    >
                    <span>{{
                        effectFormatter(
                            p.dichotomous
                                ? Math.exp(r.item[`${p.name}:beta`])
                                : r.item[`${p.name}:beta`]
                        )
                    }}</span>
                </template>
                <template
                    v-slot:[phenotypePValueColumn(p)]="r"
                    v-for="p in phenotypes"
                    >{{ pValueFormatter(r.item[`${p.name}:pValue`]) }}</template
                >
            </b-table>
            <b-pagination
                class="pagination-sm justify-content-center"
                v-model="currentPage"
                :total-rows="groupedAssociations.length"
                :per-page="perPage"
            ></b-pagination>
        </div>
        <div v-else>
            <h4 v-if="associations.length > 0">
                No overlapping associations across phenotypes
            </h4>
            <h4 v-else>No associations</h4>
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

import Documentation from "@/components/Documentation";
import TooltipDocumentation from "@/components/TooltipDocumentation";
import { decodeNamespace } from "@/utils/filterHelpers";

export default Vue.component("associations-table", {
    props: ["associations", "phenotypes", "filter"],
    components: {
        Documentation,
        TooltipDocumentation,
    },
    data() {
        return {
            perPage: 10,
            currentPage: 1,
            baseFields: [
                {
                    key: "position",
                    label: "Position",
                },
                {
                    key: "allele",
                    label: "Allele",
                },
                {
                    key: "dbSNP",
                    label: "dbSNP",
                },
                {
                    key: "consequence",
                    label: "Consequence",
                },
                {
                    key: "genes",
                    label: "Closest Genes",
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
                        key: `${p.name}:pValue`,
                        label: `P-Value`,
                        tdClass(x) {
                            return !!x && x < 1e-5
                                ? "variant-table-cell high"
                                : "";
                        },
                    },
                    {
                        key: `${p.name}:beta`,
                        label: !!p.dichotomous ? "Odds Ratio" : "Beta",
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
                let dataIndex = groups[r.varId];

                if (!dataIndex) {
                    dataIndex = data.length;
                    groups[r.varId] = dataIndex;

                    data.push({
                        phenotype: r.phenotype,
                        varId: r.varId,
                        chromosome: r.chromosome,
                        position: r.position,
                        reference: r.reference,
                        dbSNP: r.dbSNP,
                        consequence: r.consequence,
                        nearest: r.nearest,
                        alt: r.alt,
                        minP: 1.0,
                    });
                }

                // add the phenotype columns
                data[dataIndex][`${r.phenotype}:pValue`] = r.pValue;
                data[dataIndex][`${r.phenotype}:beta`] = r.beta;
                data[dataIndex][`${r.phenotype}:stdErr`] = r.stdErr;
                data[dataIndex][`${r.phenotype}:zScore`] = r.zScore;
                data[dataIndex][`${r.phenotype}:n`] = r.n;

                // lowest p-value across all phenotypes
                if (!!r.pValue && r.pValue < data[dataIndex].minP) {
                    data[dataIndex].minP = r.pValue;
                }
            }

            // remove non-overlapping associations
            data = data.filter((row) => {
                for (let i in this.phenotypes) {
                    let phenotype = this.phenotypes[i];

                    // ensure a p-value exists for each phenotype
                    if (!row[`${phenotype.name}:pValue`]) {
                        return false;
                    }
                }

                return true;
            });

            // sort all the records by phenotype p-value
            data.sort((a, b) => a.minP - b.minP);

            return data;
        },
        tableData() {
            let dataRows = this.associations;
            if (!!this.filter) {
                dataRows = this.associations.filter(this.filter);
            }
            return dataRows;
        },
    },

    methods: {
        phenotypeBetaColumn(phenotype) {
            return `cell(${phenotype.name}:beta)`;
        },
        phenotypePValueColumn(phenotype) {
            return `cell(${phenotype.name}:pValue)`;
        },
        alleleFormatter({ reference, alt }) {
            return Formatters.alleleFormatter(reference, alt);
        },
        locusFormatter({ chromosome, position }) {
            return Formatters.locusFormatter(chromosome, position);
        },
        dbSNPFormatter({ dbSNP }) {
            return Formatters.dbSNPFormatter(dbSNP);
        },
        effectFormatter(effect) {
            return Formatters.effectFormatter(effect);
        },
        pValueFormatter(pValue) {
            return Formatters.pValueFormatter(pValue);
        },
        consequenceFormatter(consequence) {
            return Formatters.consequenceFormatter(consequence);
        },
    },
});
</script>
