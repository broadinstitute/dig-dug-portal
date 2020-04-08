<template>
    <div>
        <b-table
            hover
            :items="transcriptConsequence"
            :fields="fields"
            :per-page="10"
            :current-page="1"
        ></b-table>
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

export default Vue.component("transcript-consequence-table", {
    props: ["transcriptConsequence"],
    data() {
        return {
            fields: [
                {
                    key: "amino_acids",
                    label: "amino_acids"
                },
                {
                    key: "biotype",
                    label: "biotype"
                },
                {
                    key: "transcript_id",
                    label: "transcript_id"
                },
                {
                    key: "transcript_id",
                    label: "transcript_id"
                },
                {
                    key: "cadd_raw",
                    label: "cadd_raw"
                },
                 {
                    key: "cadd_raw",
                    label: "cadd_raw"
                },
                 {
                    key: "cadd_phred",
                    label: "cadd_phred"
                },
                 {
                    key: "consequence_terms",
                    label: "consequence_terms"
                },

            ]
        };
    },
    methods: {
        // rowClass(item, type) {
        //     if (!item || type !== "row") return;
        //     if (item.pValue < 2.5e-6) return "variant-table-row high";
        // }
    }
});
</script>

