<template>
    <div>
        <b-table
            hover
            :items="intergenicConsequence"
            :fields="fields"
            :per-page="perPage"
            :current-page="currPage"
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

export default Vue.component("intergenicConsequence-table", {
    props: ["intergenicConsequence"],
    data() {
        return {
            fields: [
                {
                    key: "consequence_terms",
                    label: "consequence_terms"
                },
                {
                    key: "impact",
                    label: "impact"
                },
                {
                    key: "variant_allele",
                    label: "variant_allele"
                }
            ],
            perPage: 10,
            currPage: 1
        };
    }
});
</script>

