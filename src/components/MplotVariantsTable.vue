<template>
    <div>
        <b-table
            hover
            :id="variants-table"
            :fields="fields"
            :items="variantsCleaned"
            :tbody-tr-class="rowClass"
        >
            <template v-slot:cell(rsid)="data">{{ data.value }}</template>
            <template v-slot:cell(p_value)="data">{{ data.value }}</template>
            <template v-slot:cell(chromosome)="data">{{ data.value }}</template>
            <template v-slot:cell(position)="data">{{ data.value }}</template>
            <template v-slot:cell(gene)="data">
                <i>{{ data.value }}</i>
            </template>
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
                    key: "rsid",
                    label: "rsid",
                    sortable: false
                },
                {
                    key: "p_value",
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
                },
                {
                    key: "gene",
                    label: "Closest gene",
                    sortable: false
                }
            ]
        };
    },
    methods: {
        rowClass(item, type) {
            if (!item || type !== "row") return;
            if (item.p_value < 2.5e-6) return "variant-table-row high";
        }
    },
    computed: {
        variantsCleaned() {
            if (this.$store.state.table.variants) {
                let rawVariantsData = this.$store.state.table.variants;
                let selectedDatasetId = this.$store.state.selectedDataset;
                let selectedPhenotypeId = this.$store.state.selectedPhenotype
                    .phenotype_id;
                let variantsCleaned = [];

                $.each(rawVariantsData, function(i, v) {
                    let tempArr = {};
                    tempArr["rsid"] = v[0];
                    tempArr["p_value"] =
                        v[4][selectedDatasetId][selectedPhenotypeId];
                    tempArr["chromosome"] = v[1];
                    tempArr["position"] = v[2];
                    tempArr["gene"] = v[3];

                    variantsCleaned.push(tempArr);
                });
                return variantsCleaned;
            }
        }
    }
});
</script>
