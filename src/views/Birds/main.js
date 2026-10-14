import Vue from "vue";
import Template from "./Template.vue";
import "./css/revisions.css";
import "./css/style.css";

import BirdsDashboard from "./components/BirdsDashboard.vue";
Vue.config.productionTip = false;

new Vue({
    modules: {},
    components: {
        BirdsDashboard
    },

    data() {
        return {};
    },

    created() {},

    methods: {},

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
