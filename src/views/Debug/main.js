import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

Vue.config.productionTip = false;

import GeminiSearch from "@/components/researchPortal/contextualSearch/GeminiSearch.vue";

import Alert, {
    postAlert,
    postAlertNotice,
    postAlertError,
    closeAlert,
} from "@/components/Alert";

new Vue({
    store,

    components: {
        GeminiSearch,
    },

    data: {

    },

    computed: {

    },

    watch: {

    },

    created() {

    },

    methods: {

    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
