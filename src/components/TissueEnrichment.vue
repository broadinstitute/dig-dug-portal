<template>
    <div>
        <b-pagination v-model="currentPage" :total-rows="rows" :per-page="perPage"></b-pagination>
        <b-table
            hover
            small
            responsive
            bordered
            :items="tissues"
            :fields="fields"
            :per-page="perPage"
            :current-page="currentPage"
        >
            <template v-slot:thead-top="data">
                <b-th colspan="3">
                    <span class="sr-only">Tissue</span>
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
        </b-table>
    </div>
</template>

<script>
import Vue from "vue";
import c3 from "c3";

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

export default Vue.component("tissue-enrichment", {
    props: ["phenotypes", "tissues"],

    data() {
        return {
            perPage: 10,
            currentPage: 1,
            rows: 500,
            baseFields: [
                {
                    key: "tissue",
                    label: "Tissue"
                },
                {
                    key: "method",
                    label: "Method"
                },
                {
                    key: "annotation",
                    label: "Annotation",
                    formatter(s) {
                        return s.replace(
                            /([a-z])([A-Z0-9])/g,
                            (m, p1, p2) => `${p1} ${p2}`
                        );
                    }
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
                        formatter: "pValueFormatter",
                        tdClass(x) {
                            return !!x && x < 1e-5
                                ? "variant-table-cell high"
                                : "";
                        }
                    },
                    {
                        key: `${p.name}_SNPs`,
                        label: `SNPs`,
                        formatter(x) {
                            return !!x ? x.toFixed(0) : "-";
                        }
                    }
                ]);
            }

            return fields;
        }
    },

    methods: {
        pValueFormatter(value, key, item) {
            if (!value) {
                return "-";
            }

            let x = Number.parseFloat(value);

            if (x < 1e-5) {
                return x.toExponential(2);
            } else {
                return x.toFixed(4);
            }
        }
    }
});
</script>
