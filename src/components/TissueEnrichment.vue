<template>
    <div>
        <b-pagination
            v-model="currentPage"
            :total-rows="rows"
            :per-page="perPage"
            aria-controls="variants-table"
        ></b-pagination>
        <b-table
            hover
            small
            responsive
            bordered
            :items="tissues"
            :sort-by.sync="sortBy"
            :fields="fields"
            :per-page="perPage"
            :current-page="currentPage"
            :tbody-tr-class="rowClass"
        >
            <template v-slot:thead-top="data">
                <b-th colspan="2">
                    <span class="sr-only">Tissue, Method, Annotation</span>
                </b-th>
                <b-th
                    :key="phenotype.name"
                    v-for="(phenotype, i) in phenotypes"
                    colspan="3"
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
            sortBy: "minP",
            baseFields: [
                {
                    key: "tissue",
                    label: "Tissue",
                    sortable: false
                },
                {
                    key: "method",
                    label: "Method",
                    sortable: true
                }
                //     {
                //         key: "annotation",
                //         label: "Annotation",
                //         sortable: true
                //     }
            ]
        };
    },

    computed: {
        fields() {
            let fields = this.baseFields.concat([]); // create new array

            for (let i in this.phenotypes) {
                let p = this.phenotypes[i];

                fields = fields.concat([
                    {
                        key: `${p.name}_expectedSNPs`,
                        label: `Expected SNPs`,
                        sortable: true,
                        formatter: "smallNumFormatter"
                    },
                    {
                        key: `${p.name}_SNPs`,
                        label: `SNPs`,
                        sortable: true,
                        formatter: "smallNumFormatter"
                    },
                    {
                        key: `${p.name}_pValue`,
                        label: `P-Value`,
                        sortable: true,
                        formatter: "pValueFormatter"
                    }
                ]);
            }

            return fields;
        }
    },
    methods: {
        rowClass(item, type) {
            if (!!item && type === "row") {
                if (item.minP < 5e-8) return "variant-table-row high";
            }
        },
        smallNumFormatter(value, key, item) {
            return !!value ? Number.parseFloat(value).toFixed(2) : "-";
        },
        pValueFormatter(value, key, item) {
            if (!value) {
                return "-";
            }

            let x = Number.parseFloat(value);

            if (x < 1e-5) {
                return x;
            } else {
                return x.toFixed(5);
            }
        }
    }
});
</script>
