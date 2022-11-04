import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import Template from "./Template.vue";
import store from "./store.js";

Vue.use(BootstrapVue);
Vue.config.productionTip = false;

import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import UnauthorizedMessage from "@/components/UnauthorizedMessage";
import keyParams from "@/utils/keyParams";
import Formatters from "@/utils/formatters";
import uiUtils from "@/utils/uiUtils";
import Alert, {
    postAlert,
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";


import SearchHeaderWrapper from "@/components/SearchHeaderWrapper.vue"

new Vue({
    store,

    components: {
        PageHeader,
        PageFooter,
        Alert,
        SearchHeaderWrapper,
    },

    created() {
    },

    render(createElement, context) {
        return createElement(Template);
    },

    methods: {
        ...uiUtils,
        postAlert,
        postAlertNotice,
        postAlertError,
        closeAlert,
        ancestryFormatter: Formatters.ancestryFormatter,
        consequenceFormatter: Formatters.consequenceFormatter,
        consequenceMeaning: Formatters.consequenceMeaning,
    },

    computed: {
    },

    watch: {
    }
}).$mount("#app");
