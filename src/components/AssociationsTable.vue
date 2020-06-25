<template>
    <div>
        <b-container fluid class="filtering-ui-wrapper">
            <b-row class="filtering-ui-content">
                <b-col>
                    <div class="label">Consequence</div>
                    <b-form-select
                        @change="addCompound($event, 'select_consequence','filter-consequence')"
                        :options="filter_consequence_options"
                        id="filter-consequence"
                        ref="select_consequence"
                    ></b-form-select>
                </b-col>
                <b-col>
                    <div class="label">Gene</div>
                    <b-form-input
                        id="filter-gene"
                        type="text"
                        v-model="select_gene_text"
                        @change="addCompound($event, 'select_gene','filter-gene')"
                    ></b-form-input>
                </b-col>
                <b-col class="filter-col-sm">
                    <div class="label">pValue (&le;)</div>
                    <b-form-input
                        id="filter-pValue"
                        type="text"
                        v-model="select_pValue_text"
                        @change="addCompound($event, 'select_pValue','filter-pValue', false)"
                        ref="select_pValue"
                    ></b-form-input>
                </b-col>
                <b-col class="filter-col-sm">
                    <div class="label">Effect</div>
                    <b-form-select
                        id="filter-beta"
                        @input="addCompound($event, 'select_beta','filter-beta', false)"
                        :options="select_beta_options"
                        ref="select_beta"
                        v-model="select_beta"
                    ></b-form-select>
                </b-col>
            </b-row>
        </b-container>
        <b-container fluid class="selected-filters-ui-wrapper">
            <b-row
                v-if="select_consequence.length > 0 || select_gene.length > 0 || select_pValue || select_beta"
            >
                <b-col>
                    <span>Selected Filters:&nbsp;&nbsp;</span>
                    <template v-if="select_consequence.length > 0">
                        <b-badge
                            pill
                            variant="success"
                            v-for="(v,i) in select_consequence"
                            :key="v"
                            @click="removeFilter(i, 'select_consequence')"
                            class="btn"
                        >
                            {{v}}
                            <span class="remove">X</span>
                        </b-badge>
                    </template>
                    <template v-if="select_gene.length > 0">
                        <b-badge
                            pill
                            variant="warning"
                            v-for="(g,i) in select_gene"
                            :key="g"
                            @click="removeFilter(i, 'select_gene')"
                            class="btn"
                        >
                            {{g}}
                            <span class="remove">X</span>
                        </b-badge>
                    </template>
                    <template v-if="select_pValue.length > 0">
                        <b-badge
                            pill
                            variant="danger"
                            @click="unsetFilter('select_pValue')"
                            class="btn"
                        >
                            {{select_pValue}}
                            <span class="remove">X</span>
                        </b-badge>
                    </template>
                    <template v-if="select_beta">
                        <b-badge
                            pill
                            variant="primary"
                            @click="unsetFilter('select_beta')"
                            class="btn"
                        >
                            {{select_beta_options.find(e => e.value === select_beta).text}}
                            <span
                                class="remove"
                            >X</span>
                        </b-badge>
                    </template>
                </b-col>
            </b-row>
        </b-container>

        <div v-if="rows > 0">
            <b-table
                hover
                small
                responsive="sm"
                :items="tableData"
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
import Filters from "@/utils/filters";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import Documentation from "@/components/Documentation";
import TooltipDocumentation from "@/components/TooltipDocumentation";

export default Vue.component("associations-table", {
    props: ["associations", "phenotypes"],
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
            ],

            select_pValue: "",
            select_pValue_text: "",
            select_consequence: [],
            select_gene: [],
            select_gene_text: "",
            select_beta: "",
            select_beta_options: [
                { value: "p", text: "Positive" },
                { value: "n", text: "Negative" }
            ]
        };
    },
    mounted() {},
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

                            return Formatters.effectFormatter(x);
                        }
                    }
                ]);
            }

            return fields;
        },

        rows() {
            return this.tableData.length;
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
        },
        filter_consequence_options() {
            return this.groupedAssociations
                .map(v => Formatters.consequenceFormatter(v.consequence))
                .filter((v, i, arr) => arr.indexOf(v) == i)
                .filter((v, i, arr) => v != undefined);
        },
        tableData() {
            let dataRows = this.groupedAssociations;

            let consequenceFiltered =
                this.select_consequence.length > 0
                    ? Filters.filterFormatted(
                          dataRows,
                          this.select_consequence,
                          "consequence"
                      )
                    : dataRows;

            let geneFiltered =
                this.select_gene.length > 0
                    ? Filters.filterTable(
                          consequenceFiltered,
                          this.select_gene,
                          "gene"
                      )
                    : consequenceFiltered;

            let pValueFiltered =
                this.select_pValue != ""
                    ? Filters.filterPValue(
                          geneFiltered,
                          this.select_pValue,
                          "minP"
                      )
                    : geneFiltered;

            let betaFiltered = this.select_beta
                ? Filters.filterBeta(
                      pValueFiltered,
                      this.select_beta,
                      `${this.phenotypes[0].name}_beta`
                  )
                : pValueFiltered;

            return betaFiltered;
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
        },
        addFilter(event, obj) {
            //console.log("add" + event);
            this[obj].push(event.trim());
            this[obj + "_text"] = "";
        },
        setFilter(event, obj) {
            this[obj] = event;
            this[obj + "_text"] = "";
        },
        removeFilter(index, obj) {
            this[obj].splice(index, 1);
        },
        unsetFilter(obj) {
            this[obj] = "";
        },
        addSingle(event, obj) {
            this.addFilter(event, obj);
            this.clearCompound();
        },
        addCompound(event, obj, id, multiple = true) {
            if (multiple) this.addFilter(event, obj);
            else this.setFilter(event, obj);

            let element = document.getElementById(id);
            element.value = "";
        },
        clearCompound() {
            this.select_consequence = [];
            this.select_gene = [];
            this.select_pValue = "";
            this.select_beta = "";
        }
    }
});
</script>
