<template>
    <div>
        <div v-if="tableData.length > 0">
            <b-row class="mb-2">
                <b-col class="d-flex align-items-center">
                    <strong class="mr-2">Total Rows:</strong>
                    {{ tableData.length }}</b-col
                >
                <b-col class="text-right"
                    ><data-download
                        :data="sortedAssociations"
                        filename="associations"
                    ></data-download
                ></b-col>
            </b-row>

            <b-table
                :class="!!showBottomLine ? 'assoc-table-bottom-line' : ''"
                hover
                small
                responsive="sm"
                :items="groupedAssociations"
                :fields="fields"
                :per-page="perPage"
                :current-page="currentPage"
                :sort-null-last="true"
                :sortable="true"
            >
                <template #thead-top="data">
                    <b-th v-if="showBottomLine" :colspan="1" class="bl-bar">
                    </b-th>
                    <b-th :colspan="!!showChiSquared ? 6 : 5">
                        <span class="sr-only">Variant</span>
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
                <template #cell(position)="r">
                    {{ locusFormatter(r.item) }}
                </template>
                <template #cell(allele)="r">
                    {{ alleleFormatter(r.item) }}
                </template>
                <template #cell(dbSNP)="r">
                    {{ dbSNPFormatter(r.item) }}
                </template>
                <template #cell(consequence)="r">
                    {{ consequenceFormatter(r.item.consequence) }}
                </template>
                <template #cell(genes)="r">
                    <a
                        v-for="gene in r.item.nearest"
                        :key="gene"
                        class="item"
                        :href="`/gene.html?gene=${gene}`"
                        >{{ gene }}</a
                    >
                </template>
                <template #cell(maf)="r">
                    {{ mafFormatter(r.item.maf) }}
                </template>

                <template v-for="p in phenotypes" #[phenotypeBetaColumn(p)]="r">
                    <span
                        :key="p.name"
                        :class="`effect ${
                            r.item[`${p.name}:beta`] < 0
                                ? 'negative'
                                : 'positive'
                        }`"
                    >
                        {{
                            !!r.item[`${p.name}:beta`]
                                ? r.item[`${p.name}:beta`] < 0
                                    ? "&#9660;"
                                    : "&#9650;"
                                : ""
                        }}
                    </span>
                    <span>
                        {{
                            effectFormatter(
                                p.dichotomous
                                    ? Math.exp(r.item[`${p.name}:beta`])
                                    : r.item[`${p.name}:beta`]
                            )
                        }}
                    </span>
                </template>
                <template
                    v-for="p in phenotypes"
                    #[phenotypePValueColumn(p)]="r"
                    >{{ pValueFormatter(r.item[`${p.name}:pValue`]) }}</template
                >
            </b-table>
            <b-pagination
                v-model="currentPage"
                class="pagination-sm justify-content-center"
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

<style scoped>
@import url("/css/table.css");
div.assoc-table-bottom-line >>> table.table-sm th:first-child,
div.assoc-table-bottom-line >>> table.table-sm td:first-child {
    width: 10px;
    max-width: 10px;
    padding: 0;
}
</style>

<script>
import Vue from "vue";
import $ from "jquery";

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import Formatters from "@/utils/formatters";
import { filter } from "lodash";
Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import DataDownload from "@/components/DataDownload";
import Chi from "chi-squared";

import { isEqual } from "lodash";

export default Vue.component("AssociationsTable", {
    components: {
        DataDownload,
    },
    props: [
        "associations",
        "phenotypes",
        "filter",
        "exclusive",
        "showBottomLine",
    ],
    data() {
        return {
            perPage: 10,
            currentPage: 1,
            baseFields: [
                {
                    key: "position",
                    label: "Position(CHR:POS)",
                },
                {
                    key: "allele",
                    label: "Allele(REF:ALT)",
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
                // {
                //     key: "maf",
                //     label: "MAF"
                // }
            ],
        };
    },
    computed: {
        showChiSquared() {
            return this.phenotypes.length > 1;
        },
        fields() {
            let metaTypes = {
                key: "inMetaTypes",
                label: "",
                formatter: (x) => "",
                tdClass(x) {
                    return x === "bottom-line"
                        ? "bottom-line-only"
                        : x === "bottom-line;min_p"
                        ? "bottom-line-min-p"
                        : x === "bottom-line;min_p;largest"
                        ? "all-meta-types"
                        : "";
                },
            };
            let startingFields = this.showBottomLine ? [metaTypes] : [];
            let fields = startingFields.concat(this.baseFields);

            // show chi^2 if > 1 phenotype
            if (this.phenotypes.length > 1) {
                fields.push({
                    key: "chiSquared",
                    label: "P-Value(Χ²)",
                    sortable: true,
                    numeric: true,
                    formatter: this.pValueFormatter,
                });
            } else if (this.phenotypes.length <= 1) {
                for (let i = 0; i < fields.length; i++) {
                    if (fields[i].key === "chiSquared") {
                        fields.splice(i, 1);
                        console.log("splicesd", fields);
                    }
                }

                // => objects for ['fred']
            }

            for (let i in this.phenotypes) {
                let p = this.phenotypes[i];

                fields = fields.concat([
                    {
                        key: `${p.name}:pValue`,
                        label: `P-Value`,
                        sortable: true,
                        numeric: true,
                        tdClass(x) {
                            return !!x && x < 1e-5
                                ? "variant-table-cell high"
                                : "";
                        },
                    },
                    {
                        key: `${p.name}:beta`,
                        label: p.dichotomous ? "Odds Ratio" : "Beta",
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

                if (!(r.varId in groups)) {
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
                        maf: r.maf,
                        inMetaTypes: r.inMetaTypes,
                    });
                }

                // add the phenotype columns
                data[dataIndex][`${r.phenotype}:pValue`] = r.pValue;
                data[dataIndex][`${r.phenotype}:beta`] = r.beta;

                data[dataIndex][`${r.phenotype}:stdErr`] = r.stdErr;
                data[dataIndex][`${r.phenotype}:zScore`] = r.zScore;
                data[dataIndex][`${r.phenotype}:n`] = r.n;
            }

            // remove entries with missing p-values
            if (this.exclusive) {
                let phenotypes = this.phenotypes;

                data = data.filter((row) => {
                    return phenotypes.every((p) => !!row[`${p.name}:pValue`]);
                });
            }

            // calculate the chiSquared for each row
            data.forEach((r) => (r.chiSquared = this.chiSquared(r)));

            return data;
        },
        sortedAssociations() {
            return this.tableData.sort((a, b) => a.pValue - b.pValue);
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
            return `cell(${phenotype.name}:beta)`;
        },
        phenotypePValueColumn(phenotype) {
            return `cell(${phenotype.name}:pValue)`;
        },
        phenotypeMafColumn(phenotype) {
            return `cell(${phenotype.name}:maf)`;
        },
        alleleFormatter({ reference, alt }) {
            return Formatters.alleleFormatter(reference, alt);
        },
        chiFormatter(chi) {
            return Formatters.floatFormatter(chi);
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
        mafFormatter(pValue) {
            return Formatters.floatFormatter(pValue);
        },
        consequenceFormatter(consequence) {
            return Formatters.consequenceFormatter(consequence);
        },
        chiSquared(row) {
            let X = 0.0;
            let n = 0;

            for (let i in this.phenotypes) {
                let p = row[`${this.phenotypes[i].name}:pValue`];

                if (p) {
                    X += -2 * Math.log(p);
                    n++;
                }
            }

            // calculate the combined p-value
            let pdf = Chi.pdf(X, 2 * n);

            return 2 * pdf;
        },
        backgroundColor(x) {
            let bottomLineOnly = "#6dcff6";
            let bottomLineMinP = "#8781bd";
            let allMetaTypes = "#b6aaa7";
            let fallback = "#ffffff";
            return x === "bottom-line"
                ? "bottom-line-only"
                : x === "bottom-line;min_p"
                ? "bottom-line-min-p"
                : x === "bottom-line;min_p;largest"
                ? "all-meta-types"
                : "";
        },
    },
});
</script>
