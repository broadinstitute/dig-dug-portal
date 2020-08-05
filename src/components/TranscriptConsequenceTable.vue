<template>
    <div>
        <div v-if="rows > 0">
            <b-table
                hover
                small
                responsive="sm"
                :items="sortedTranscriptConsequences"
                :fields="fields"
                :per-page="perPage"
                :current-page="currentPage"
            >
                <template
                    v-slot:cell(consequence)="v"
                >{{consequenceFormatter(v.item.consequence_terms[0])}}</template>
                <template v-slot:cell(gene)="v">
                    <a :href="'/gene.html?gene=' + v.item.gene_symbol">{{v.item.gene_symbol}}</a>
                </template>
            </b-table>
            <b-pagination
                class="pagination-sm justify-content-center"
                v-model="currentPage"
                :total-rows="rows"
                :per-page="perPage"
            ></b-pagination>
        </div>
        <div v-else>No predicted transcript consequences found.</div>
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
    props: ["transcriptConsequences"],
    data() {
        return {
            fields: [
                {
                    key: "consequence",
                    label: "Consequence",
                },
                {
                    key: "gene",
                    label: "Gene",
                },
                {
                    key: "transcript_id",
                    label: "Transcript",
                },
                {
                    key: "biotype",
                    label: "Biotype",
                    formatter: Formatters.bioTypeFormatter,
                },
                {
                    key: "distance",
                    label: "Distance",
                    formatter: Formatters.intFormatter,
                },
                {
                    key: "impact",
                    label: "Impact",
                },
                {
                    key: "amino_acids",
                    label: "Amino Acids",
                },
            ],
            perPage: 5,
            currentPage: 1,
        };
    },

    computed: {
        rows() {
            return this.transcriptConsequences.length;
        },
        sortedTranscriptConsequences() {
            return this.transcriptConsequences
                .sort((a, b) => a.pick === 1)
                .map((cqs) => {
                    return {
                        _rowVariant: cqs.pick === 1 ? "success" : null,
                        ...cqs,
                    };
                });
        },
    },
    methods: {
        consequenceFormatter: Formatters.consequenceFormatter,
    },
});
</script>
