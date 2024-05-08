import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import SearchHeaderWrapper from "@/components/SearchHeaderWrapper.vue";
import GeneSelectPicker from "@/components/GeneSelectPicker.vue";

import keyParams from "@/utils/keyParams";

Vue.config.productionTip = false;
Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);

new Vue({
    store,
    modules: {},
    components: {
        PageHeader,
        PageFooter,
        SearchHeaderWrapper,
        GeneSelectPicker,
    },

    data() {
        return {};
    },

    created() {
        if (keyParams.gene) {
            console.log("gene", keyParams.gene);
        }
        this.$store.dispatch("queryGeneName", this.$store.state.geneName);
        this.$store.dispatch("bioPortal/getDiseaseGroups");
    },

    methods: {},

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
