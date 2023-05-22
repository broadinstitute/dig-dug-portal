<template>
    <div id="clump-associations">
        <b-row class="mb-2">
            <b-col class="text-right">
                <data-download
                    :data="clumpedAssociations"
                    filename="clumped-associations"
                ></data-download
            ></b-col>
        </b-row>
        <div v-if="tableData.length">
            <b-table
                hover
                small
                responsive="sm"
                :items="clumpedAssociations"
                :fields="fields"
                :per-page="perPage"
                :current-page="currentPage"
            >
                <template #thead-top="data">
                    <b-th colspan="1">
                        <span class="sr-only">Clump</span>
                    </b-th>
                    <b-th
                        v-for="(phenotype, i) in phenotypes"
                        :key="phenotype"
                        colspan="3"
                        class="reference"
                        :class="'color-' + (i + 1)"
                    >
                        <span style="color: white">{{
                            phenotypeMap[phenotype].description
                        }}</span>
                        <span v-if="i == 0" style="color: white">
                            (lead SNP)
                        </span>
                    </b-th>
                </template>
                <template #cell(clumpRegion)="r">
                    <a
                        :href="`/region.html?phenotype=${phenotypes.join(
                            ','
                        )}&chr=${r.item.chromosome}&start=${
                            r.item.clumpStart
                        }&end=${r.item.clumpEnd}`"
                        >{{ clumpFormatter(r.item) }}</a
                    >
                </template>
                <template
                    v-for="p in phenotypes"
                    #[phenotypeVariantColumn(p)]="r"
                >
                    <a
                        :key="p"
                        :href="`/variant.html?variant=${r.item[`${p}:varId`]}`"
                        >{{ r.item[`${p}:dbSNP`] || r.item[`${p}:varId`] }}</a
                    >
                </template>
                <!--
                <template
                    v-slot:[phenotypeDbSNPColumn(p)]="r"
                    v-for="p in phenotypes"
                >
                    <a
                        :href="`/variant.html?variant=${r.item[`${p}:dbSNP`]}`"
                        >{{ dbSNPFormatter(r.item[`${p}:dbSNP`]) }}</a
                    >
                </template>
                <template
                    v-slot:[phenotypeConsequenceColumn(p)]="r"
                    v-for="p in phenotypes"
                    >{{
                        consequenceFormatter(r.item[`${p.name}:consequence`])
                    }}</template
                >
                <template
                    v-slot:[phenotypeGenesColumn(p)]="r"
                    v-for="p in phenotypes"
                >
                    <a
                        v-for="gene in r.item[`${p.name}:nearest`]"
                        class="item"
                        :href="`/gene.html?gene=${gene}`"
                        >{{ gene }}</a
                    >
                </template>
                -->
                <template v-for="p in phenotypes" #[phenotypeBetaColumn(p)]="r">
                    <span
                        :class="`effect ${
                            alignedBeta(p, r.item) < 0 ? 'negative' : 'positive'
                        }`"
                        >{{
                            alignedBeta(p, r.item) < 0 ? "&#9660;" : "&#9650;"
                        }}</span
                    >
                    <span>{{ effectFormatter(p, r.item) }}</span>
                    <span v-if="r.item[`${p}:alignment`] < 0">
                        <a href="#aligned-beta">&nbsp;&#x21f5;</a>
                    </span>
                </template>
                <template
                    v-for="p in phenotypes"
                    #[phenotypePValueColumn(p)]="r"
                    >{{ pValueFormatter(r.item[`${p}:pValue`]) }}</template
                >
            </b-table>
            <b-pagination
                v-model="currentPage"
                class="pagination-sm justify-content-center"
                :total-rows="clumpedAssociations.length"
                :per-page="perPage"
            ></b-pagination>
            <div class="p-2 text-center">
                <documentation
                    id="aligned-beta"
                    name="table.clumped-associations.alignment"
                ></documentation>
            </div>
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

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import Formatters from "@/utils/formatters";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import Documentation from "@/components/Documentation";
import DataDownload from "@/components/DataDownload";

import { isEqual } from "lodash";

export default Vue.component("ClumpedAssociationsTable", {
    components: {
        Documentation,
        DataDownload,
    },
    props: [
        "associations",
        "phenotypes",
        "phenotypeMap",
        "filter",
        "exclusive",
    ],
    data() {
        return {
            perPage: 10,
            currentPage: 1,
            baseFields: [
                {
                    key: "clumpRegion",
                    label: "Clump",
                },
            ],
        };
    },
    computed: {
        fields() {
            let fields = this.baseFields;

            for (let i in this.phenotypes) {
                let p = this.phenotypes[i];
                let dichotomous = this.phenotypeMap[p].dichotomous;

                fields = fields.concat([
                    {
                        key: `${p}:varId`,
                        label: "Variant",
                    },
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
                        key: `${p}:beta`,
                        label: dichotomous ? "Odds Ratio" : "Beta",
                    },
                ]);
            }

            return fields;
        },
        clumpedAssociations() {
            let data = [];
            let clumps = {};
            let associations = this.tableData;

            for (let i in associations) {
                let r = associations[i];
                let dataIndex = clumps[r.clump];

                if (!(r.clump in clumps)) {
                    dataIndex = data.length;
                    clumps[r.clump] = dataIndex;

                    data.push({
                        chromosome: r.chromosome,
                        clump: r.clump,
                        clumpStart: r.clumpStart,
                        clumpEnd: r.clumpEnd,
                        minP: 1.0,
                    });
                }

                // add the phenotype columns
                data[dataIndex][`${r.phenotype}:varId`] = r.varId;
                data[dataIndex][`${r.phenotype}:dbSNP`] = r.dbSNP;
                data[dataIndex][`${r.phenotype}:consequence`] = r.consequence;
                data[dataIndex][`${r.phenotype}:nearest`] = r.nearest;
                data[dataIndex][`${r.phenotype}:pValue`] = r.pValue;
                data[dataIndex][`${r.phenotype}:beta`] = r.beta;
                data[dataIndex][`${r.phenotype}:alignment`] = r.alignment;
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
                    if (!row[`${phenotype}:pValue`]) {
                        return false;
                    }
                }

                return true;
            });

            // remove entries with missing p-values
            if (this.exclusive) {
                let phenotypes = this.phenotypes;

                data = data.filter((row) => {
                    return phenotypes.every((p) => !!row[`${p}:pValue`]);
                });
            }

            // sort all the records by phenotype p-value
            data.sort((a, b) => a.minP - b.minP);

            return data;
        },
        tableData() {
            let dataRows = this.associations;
            if (this.filter) {
                dataRows = this.associations.filter(this.filter);
            }
            return dataRows;
        },
    },
    watch: {
        phenotypes: {
            handler(newData, oldData) {
                if (!isEqual(newData, oldData)) {
                    this.currentPage = 1;
                }
            },
            deep: true,
        },
    },
    methods: {
        phenotypeBetaColumn(phenotype) {
            return `cell(${phenotype}:beta)`;
        },
        phenotypePValueColumn(phenotype) {
            return `cell(${phenotype}:pValue)`;
        },
        phenotypeVariantColumn(phenotype) {
            return `cell(${phenotype}:varId)`;
        },
        phenotypeDbSNPColumn(phenotype) {
            return `cell(${phenotype}:dbSNP)`;
        },
        phenotypeConsequenceColumn(phenotype) {
            return `cell(${phenotype}:consequence)`;
        },
        phenotypeGeneColumn(phenotype) {
            return `cell(${phenotype}:nearest)`;
        },
        clumpFormatter({ chromosome, clumpStart, clumpEnd }) {
            return Formatters.locusFormatter(chromosome, clumpStart, clumpEnd);
        },
        dbSNPFormatter(dbSNP) {
            return Formatters.dbSNPFormatter(dbSNP);
        },
        alignedBeta(phenotype, r) {
            let beta = r[`${phenotype}:beta`];
            let alignment = r[`${phenotype}:alignment`] || 1.0;

            return beta * alignment;
        },
        effectFormatter(phenotype, r) {
            let effect = this.alignedBeta(phenotype, r);

            if (this.phenotypeMap[phenotype].dichotomous) {
                effect = Math.exp(effect);
            }

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
