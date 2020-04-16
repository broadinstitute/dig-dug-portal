<template>
    <div>
        <b-table
            hover
            :items="transcriptionFactors"
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

export default Vue.component("transcription-factors-table", {
    props: ["transcriptionFactors"],
    data() {
        return {
            fields: [
                {
                    key: "positionWeightMatrix",
                    label: "positionWeightMatrix"
                },
                {
                    key: "delta",
                    label: "delta",
                    formatter: Formatters.floatFormatter
                },
                {
                    key: "position",
                    label: "position",
                    formatter: Formatters.intFormatter
                },
                {
                    key: "strand",
                    label: "strand"
                },
                {
                    key: "refScore",
                    label: "refScore",
                    formatter: Formatters.floatFormatter
                },
                {
                    key: "altScore",
                    label: "altScore",
                    formatter: Formatters.floatFormatter
                }
            ],
            perPage: 10,
            currPage: 1
        };
    }
});
</script>

