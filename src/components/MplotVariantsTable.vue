<template>
    <div>
        <b-table hover :fields="fields" :items="variants" :tbody-tr-class="rowClass">
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
    props: ["variants"],
    data() {
        return {
            fields: [
                {
                    key: "varId",
                    label: "varId",
                    sortable: false
                },
                {
                    key: "pValue",
                    label: "p-value",
                    sortable: true
                },
                {
                    key: "chromosome",
                    label: "Chromosome",
                    sortable: true
                },
                {
                    key: "position",
                    label: "Position",
                    sortable: false
                }
            ]
        };
    },
    methods: {
        rowClass(item, type) {
            if (!item || type !== "row") return;
            if (item.pValue < 2.5e-6) return "variant-table-row high";
        }
    }
});
</script>

