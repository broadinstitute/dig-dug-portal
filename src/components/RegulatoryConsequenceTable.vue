<template>
    <div>
        <b-table
            hover
            :items="regulatoryConsequence"
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

export default Vue.component("regulatoryConsequence-table", {
    props: ["regulatoryConsequence"],
    data() {
        return {
            fields: [
                {
                    key: "biotype",
                    label: "biotype"
                },
                {
                    key: "biotype",
                    label: "biotype"
                },
                {
                    key: "consequence_terms",
                    label: "consequence_terms"
                },
                {
                    key: "impact",
                    label: "impact"
                },

                {
                    key: "regulatory_feature_id",
                    label: "regulatory_feature_id"
                }
            ],
            perPage: 10,
            currPage: 1
        };
    }
});
</script>

