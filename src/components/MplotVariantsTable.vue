<template>
    <div>
        <b-pagination v-model="currentPage" :total-rows="rows" :per-page="perPage"></b-pagination>
        <b-table
            hover
            small
            bordered
            responsive="sm"
            :items="variants"
            :fields="fields"
            :per-page="perPage"
            :current-page="currentPage"
            :tbody-tr-class="rowClass"
        >
            <template v-slot:thead-top="data">
                <b-th colspan="3">
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
            <template v-slot:cell(allele)="r">{{r.item.reference}}/{{r.item.alt}}</template>
        </b-table>
    </div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

export default Vue.component("mplot-variants-table", {
    props: ["variants", "phenotypes"],
    data() {
        return {
            perPage: 10,
            currentPage: 1,
            rows: 500,
            baseFields: [
                {
                    key: "chromosome",
                    label: "Chr"
                },
                {
                    key: "position",
                    label: "Position"
                },
                {
                    key: "allele",
                    label: "Allele"
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
                        sortable: false
                    },
                    {
                        key: `${p.name}_beta`,
                        label: `Beta`,
                        formatter: x => (!!x ? x.toFixed(4) : "-")
                    }
                ]);
            }

            return fields;
        }
    },

    methods: {
        rowClass(item, type) {
            if (!!item && type === "row") {
                if (item.minP < 2.5e-6) return "variant-table-row high";
            }
        },
        phenotypeFormatter(value) {
            return this.phenotypeMap[value].name;
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
