<template>
    <div>
        <b-table
            hover
            :items="transcriptionFactors"
            :fields="fields"
            :per-page="10"
            :current-page="1"
        ></b-table>
    </div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

export default Vue.component("transcription-factors-table", {
    props: ["transcriptionFactors"],
    data() {
        return {
            fields: [
                {
                    key: "varId",
                    label: "varId"
                },
                {
                    key: "positionWeightMatrix",
                    label: "positionWeightMatrix"
                },
                {
                    key: "delta",
                    label: "delta"
                },
                {
                    key: "position",
                    label: "position"
                },
                {
                    key: "strand",
                    label: "strand"
                },
                {
                    key: "refScore",
                    label: "refScore"
                },
                {
                    key: "altScore",
                    label: "altScore"
                }
            ]
        };
    },
    methods: {
        // rowClass(item, type) {
        //     if (!item || type !== "row") return;
        //     if (item.pValue < 2.5e-6) return "variant-table-row high";
        // }
    }
});
</script>

