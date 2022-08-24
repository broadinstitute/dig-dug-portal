<template>
    <div>
        <div class="text-right mt-2 mb-2">
            <csv-download
                :data="tableData"
                filename="bchtest_table"
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
                <a :href="'/test.html?gene=' + v.item.gene_id">{{
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



export default Vue.component("bchtest-table", {
    props: ["genes", "filter"],
    /*components: {
        Documentation,
        TooltipDocumentation,
        CsvDownload,
    },*/
    data() {
        return {
            fields: [
                {
                    key: "chromosome",
                    label: "Chromosome",
                },
                {
                    key: "start",
                    label: "Start",
                },
                {
                    key: "end",
                    label: "END",
                },
                {
                    key: "name",
                    label: "Name",
                },
                {
                    key: "source",
                    label: "Source",
                },
                {
                    key: "type",
                    label: "Type",
                }
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
            let dataRows = this.genes;
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
    }
});

</script>
<style>
@import url("/css/table.css");
</style>