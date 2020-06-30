<template>
    <div>
        <b-table
            hover
            small
            responsive="sm"
            :items="sortedCredibleVariants"
            :fields="fields"
            :per-page="perPage"
            :current-page="currentPage"
        ></b-table>
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

export default Vue.component("credible-variants-table", {
    props: ["credibleVariants"],
    data() {
        return {
            fields: [
                {
                    key: "varId",
                    label: "varId"
                },
                {
                    key: "pValue",
                    label: "pValue"
                },
                {
                    key: "posteriorProbability",
                    label: "Posterior Probability"
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
            return this.crediblevariants.length;
        },
        sortedCredibleVariants() {
            // TODO
            return this.crediblevariants
            // .sort((a, b) => b.subjects - a.subjects);
        }
    }
});
</script>
