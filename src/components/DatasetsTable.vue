<template>
    <div>
        <b-pagination
            class="pagination-sm justify-content-end"
            v-model="currentPage"
            :total-rows="rows"
            :per-page="perPage"
        ></b-pagination>
        <b-table
            hover
            small
            responsive="sm"
            :items="sortedDatasets"
            :fields="fields"
            :per-page="perPage"
            :current-page="currentPage"
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

export default Vue.component("datasets-table", {
    props: ["datasets"],
    data() {
        return {
            fields: [
                {
                    key: "name",
                    label: "Name"
                },
                {
                    key: "tech",
                    label: "Tech"
                },
                {
                    key: "ancestry",
                    label: "Ancestry",
                    formatter: Formatters.ancestryFormatter
                },
                {
                    key: "cases",
                    label: "Cases",
                    formatter: Formatters.intFormatter
                },
                {
                    key: "controls",
                    label: "Controls",
                    formatter: Formatters.intFormatter
                },
                {
                    key: "subjects",
                    label: "Subjects",
                    formatter: Formatters.intFormatter
                }
            ],
            perPage: 5,
            currentPage: 1,
            sortName: "subjects",
            sortOrder: "desc"
        };
    },
    computed: {
        rows() {
            return this.datasets.length;
        },
        sortedDatasets() {
            return this.datasets.sort((a, b) => b.subjects - a.subjects);
        }
    }
});
</script>
