import Vue from "vue";
//import BootstrapVue from "bootstrap-vue";
//import { BootstrapVueIcons } from "bootstrap-vue";
import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

Vue.use(BootstrapVueIcons);

import Template from "./Template.vue";
import store from "./store.js";

Vue.use(BootstrapVue);
Vue.config.productionTip = false;

import ResearchAnnotationsPlot from "@/components/researchPortal/ResearchAnnotationsPlot.vue";
import Alert, {
    postAlert,
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";

new Vue({
    store,
    components: {
        ResearchAnnotationsPlot,
    },
    render(createElement, context) {
        return createElement(Template);
    },
    methods: {
        postAlert,
        postAlertNotice,
        postAlertError,
        closeAlert,

    },
}).$mount("#app");
