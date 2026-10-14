import Vue from "vue";
import Template from "./Template.vue";
import "./css/revisions.css";
import "./css/style.css";

import BirdsDashboard from "./components/BirdsDashboard.vue";

import panels from "./content/panels.js";
import validation from "./content/validation.js";
import modelgraph from "./content/modelgraph.js";
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
