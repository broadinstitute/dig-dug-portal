<template>
    <div>
        <tr v-for="row in $store.state.variant.data">
            <td>amino_acids {{row.transcriptConsequence.amino_acids}}</td>
            <td>biotype {{row.transcriptConsequence.biotype}}</td>
            <td>cadd_phred {{row.transcriptConsequence.cadd_phred}}</td>
            <td>transcript_id {{row.transcriptConsequence.transcript_id}}</td>
            <!-- <td>consequence_terms {{row.transcriptConsequence.consequence_terms}</td> -->
        </tr>
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

export default Vue.component("transcriptConsequence-table", {
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

