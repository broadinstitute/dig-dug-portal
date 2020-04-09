<template>
    <div>
        <b-table hover small :fields="fields" :items="variants" :tbody-tr-class="rowClass">
            <template v-slot:cell(varId)="data">{{ data.value }}</template>
            <template v-slot:cell(pValue)="data">{{ data.value }}</template>
            <template v-slot:cell(chromosome)="data">{{ data.value }}</template>
            <template v-slot:cell(position)="data">{{ data.value }}</template>
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
    props: ["variants", "phenotypeMap"],
    data() {
        return {
            fields: [
                {
                    key: "varId",
                    label: "varId",
                    sortable: false
                },
                ,
                {
                    key: "phenotype",
                    label: "Phenotype",
                    sortable: true,
                    formatter: "phenotypeFormatter"
                },
                {
                    key: "pValue",
                    label: "P-Value",
                    sortable: true
                },
                {
                    key: "beta",
                    label: "Effect (beta)",
                    sortable: true
                },
                {
                    key: "stdErr",
                    label: "Standard Error",
                    sortable: true
                },
                {
                    key: "zScore",
                    label: "Z-Score",
                    sortable: true
                },
                {
                    key: "n",
                    label: "N",
                    sortable: true
                }
            ]
        };
    },
    methods: {
        rowClass(item, type) {
            if (!item || type !== "row") return;
            if (item.pValue < 2.5e-6) return "variant-table-row high";
        },
        phenotypeFormatter(value) {
            return this.phenotypeMap[value].name;
        }
    }
});
</script>
