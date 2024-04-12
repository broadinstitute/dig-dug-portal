import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import Template from "./Template.vue";
import store from "./store.js";

Vue.use(BootstrapVue);
Vue.config.productionTip = false;

import uiUtils from "@/utils/uiUtils";
//import formatters from "@/utils/formatters";

new Vue({
    store,

    components: {

    },

    data() {
        return {
        };
    },

    created() {
    },

    render(createElement, context) {
        return createElement(Template);
    },

    methods: {
        ...uiUtils
    },

    computed: {
    },

    watch: {
    },
}).$mount("#app");
