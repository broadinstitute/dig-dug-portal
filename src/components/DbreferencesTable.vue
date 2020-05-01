<template>
    <div>
        <b-pagination v-model="currentPage" :total-rows="rows" :per-page="perPage"></b-pagination>
        <b-table
            hover
            :items="dbreferences"
            :fields="fields"
            :per-page="perPage"
            :current-page="currentPage"
        >
            <template v-slot:cell(gene)="v">
                <a :href="'/gene.html?gene=' + v.item.gene_id">{{v.item.gene_id}}</a>
            </template>
        </b-table>
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

export default Vue.component("dbreferences-table", {
    props: ["dbreferences"],
    data() {
        return {
            fields: [
                {
                    key: "id",
                    label: "ID"
                },
                {
                    key: "source",
                    label: "Source"
                },
                {
                    key: "moleculeType",
                    label: "Molecule Type"
                },
                {
                    key: "proteinSeqID",
                    label: "Protein Sequence ID"
                }
            ],
            perPage: 5,
            currentPage: 1
        };
    },

    computed: {
        rows() {
            return this.dbreferences.length;
        }
    },
    methods: {
        // consequenceFormatter: Formatters.consequenceFormatter
    }
});
</script>
