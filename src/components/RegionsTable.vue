<template>
    <div>
        <div v-if="rows > 0">
            <b-pagination v-model="currentPage" :total-rows="rows" :per-page="perPage"></b-pagination>
            <b-table
                hover
                small
                bordered
                responsive="sm"
                :items="regions"
                :fields="fields"
                :per-page="perPage"
                :current-page="currentPage"
            >
                <template v-slot:cell(region)="r">
                    <a
                        :href="`/region.html?chr=${r.item.chromosome}&start=${r.item.start}&end=${r.item.end}`"
                    >{{r.item.start}}-{{r.item.end}}</a>
                </template>
            </b-table>
        </div>
        <div v-else>
            <h4 v-if="regions.length > 0">No annotated regions</h4>
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import Formatters from "@/utils/formatters";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

export default Vue.component("regions-table", {
    props: ["regions"],
    data() {
        return {
            perPage: 10,
            currentPage: 1,
            fields: [
                {
                    key: "region",
                    label: "Region"
                },
                {
                    key: "annotation",
                    label: "Annotation",
                    formatter: Formatters.capitalizedFormatter
                },
                {
                    key: "method",
                    label: "Method",
                    formatter: Formatters.capitalizedFormatter
                },
                {
                    key: "tissue",
                    label: "Tissue",
                    formatter: Formatters.tissueFormatter
                }
            ]
        };
    },

    computed: {
        rows() {
            return this.regions.length;
        }
    },

    methods: {}
});
</script>
