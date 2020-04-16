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
            ],
            perPage: 10,
            currPage: 1
        };
    },
    methods: {}
});
</script>

