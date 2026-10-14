import Vue from "vue";
import Template from "./Template.vue";


import panels from "./content/panels.js";
import validation from "./content/validation.js";
import modelgraph from "./content/modelgraph.js";
import app from "./app.js";
Vue.config.productionTip = false;

new Vue({
    modules: {},
    components: {
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
