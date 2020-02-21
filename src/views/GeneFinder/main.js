import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";

new Vue({
    store,

    components: {
        PageHeader,
        PageFooter,
    },

    created() {
        this.$store.dispatch("graphPhenotype/list");
    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
