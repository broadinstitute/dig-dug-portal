import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import $ from "jquery";
import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";

new Vue({
    store,

    components: {
        PageHeader,
        PageFooter
    },
    data: {
        selectedPhenotype: null
    },
    render(createElement, context) {
        return createElement(Template);
    }
}).$mount("#app");
