import Vue from "vue";

import keyParams from "@/utils/keyParams"

import store from "./store"
import Template from "./Template.vue";

import * as _ from "lodash";

Vue.config.productionTip = false;

new Vue({
    store,
    components: {

    },
    data() {
        return {

        }
    },
    created() {
        this.$store.dispatch("lunaris/getDataFromLunaris", "");
    },
    mounted() {

    },
    computed: {

    },
    methods: {

    },
    render(createElement, context) {
        return createElement(Template);
    },

}).$mount("#app");
