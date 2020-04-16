<template>
    <div>
        <b-table
            hover
            :items="transcriptConsequence"
            :fields="fields"
            :per-page="perPage"
            :current-page="currPage"
        ></b-table>
    </div>
</template>

<script>
import Vue from "vue";
import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import Formatters from "@/utils/formatters";

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
                    label: "cadd_raw",
                    formatter: Formatters.floatFormatter
                },
                {
                    key: "cadd_phred",
                    label: "cadd_phred",
                    formatter: Formatters.floatFormatter
                },
                {
                    key: "consequence_terms",
                    label: "consequence_terms"
                }
            ],
            perPage: 10,
            currPage: 1
        };
    }
});
</script>

