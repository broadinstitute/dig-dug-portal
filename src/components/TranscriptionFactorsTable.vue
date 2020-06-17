<template>
    <div>
        <b-table
            hover
            small
            responsive="sm"
            :items="transcriptionFactors"
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

export default Vue.component("transcription-factors-table", {
    props: ["transcriptionFactors"],
    data() {
        return {
            fields: [
                {
                    key: "positionWeightMatrix",
                    label: "Position Weight Matrix"
                },
                {
                    key: "delta",
                    label: "Delta",
                    formatter: Formatters.floatFormatter
                },
                {
                    key: "position",
                    label: "Position",
                    formatter: Formatters.intFormatter
                },
                {
                    key: "strand",
                    label: "Strand"
                },
                {
                    key: "refScore",
                    label: "Reference Score",
                    formatter: Formatters.floatFormatter
                },
                {
                    key: "altScore",
                    label: "Alt Score",
                    formatter: Formatters.floatFormatter
                }
            ],
            perPage: 5,
            currentPage: 1
        };
    },

    computed: {
        rows() {
            return this.transcriptionFactors.length;
        }
    }
});
</script>
