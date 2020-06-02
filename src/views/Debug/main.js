import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';

import LoadingBar from "@/components/LoadingBar";

import PageHeader from "@/components/PageHeader";
import PageFooter from "@/components/PageFooter";
import PhenotypeSelectPicker from "../../components/PhenotypeSelectPicker";

import LocusZoom from "@/components/lz/LocusZoom";

import Alert, {
    postAlert,
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";


import Documentation from "@/components/Documentation"
import TooltipDocumentation from "@/components/TooltipDocumentation"

Vue.config.productionTip = false;
Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);

new Vue({
    store,

    components: {
        LocusZoom,
    },

    render(createElement, context) {
        return createElement(Template);
    },

    methods: {

    },

    computed: {

    },

}).$mount("#app");
