import Vue from "vue";

import store from "./store"
import Template from "./Template.vue";

import * as _ from "lodash";
import { BIconPersonBoundingBox } from "bootstrap-vue";

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
