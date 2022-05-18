import Vue from "vue";
import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

Vue.use(BootstrapVueIcons);
import Template from "./Template.vue";
import store from "./store.js";

Vue.use(BootstrapVue);
Vue.config.productionTip = false;

import ResearchByorProjects from "@/components/researchPortal/ResearchByorProjects.vue";


new Vue({
    store,

    data: {

    },

    components: {
        ResearchByorProjects,
    },

    created() {

    },

    render(createElement, context) {
        return createElement(Template);
    },

    methods: {

    },

    computed: {

    },

    watch: {

    }
}).$mount("#app");
