import Vue from "vue";

import store from "./store"
import Template from "./Template.vue";

import * as _ from "lodash";
import { BIconPersonBoundingBox } from "bootstrap-vue";

import TooltipDocumentation from "@/components/TooltipDocumentation.vue";

Vue.config.productionTip = false;

new Vue({
    store,
    components: {
        TooltipDocumentation,
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
