<template>
    <div>
        <div class="text-right mt-2 mb-2">
            <csv-download
                :data="tableData"
                filename="UniProt_table"
            ></csv-download>
        </div>
        <b-table
            hover
            small
            responsive="sm"
            :items="tableData"
            :fields="fields"
            :per-page="perPage"
            :current-page="currentPage"
        >
            <template v-slot:cell(gene)="v">
                <a :href="'/gene.html?gene=' + v.item.gene_id">{{
                    v.item.gene_id
                }}</a>
            </template>
        </b-table>
        <b-pagination
            class="pagination-sm justify-content-center"
            v-model="currentPage"
            :total-rows="rows"
            :per-page="perPage"
        ></b-pagination>
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

import Documentation from "@/components/Documentation";
import TooltipDocumentation from "@/components/TooltipDocumentation";
import CsvDownload from "@/components/CsvDownload";

export default Vue.component("uniprot-references-table", {
    props: ["references", "filter"],
    components: {
        Documentation,
        TooltipDocumentation,
        CsvDownload,
    },
    data() {
        return {
            fields: [
                {
                    key: "id",
                    label: "ID",
                },
                {
                    key: "source",
                    label: "Source",
                },
                {
                    key: "moleculeType",
                    label: "Molecule Type",
                },
                {
                    key: "proteinSeqID",
                    label: "Protein Sequence ID",
                },
            ],
            perPage: 5,
            currentPage: 1,
            source: "",
            moleculeType: "",
        };
    },

    computed: {
        rows() {
            return this.tableData.length;
        },
        tableData() {
            let dataRows = this.references;
            if (!!this.filter) {
                dataRows = dataRows.filter(this.filter);
            }
            return dataRows;
        },
    },
    methods: {
        clearFilter(obj) {
            this[obj] = "";
        },
    },
});
</script>
