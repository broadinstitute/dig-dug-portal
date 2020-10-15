import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import Template from "./Template.vue";
import store from "./store.js";

import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import Alert, {
    postAlert,
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";
import { pageMixin } from "@/mixins/pageMixin";

Vue.use(BootstrapVue);
Vue.config.productionTip = false;

new Vue({
    store,
    mixins: [pageMixin],
    components: { PageHeader, PageFooter, Alert },
    render(createElement, context) {
        return createElement(Template);
    },
    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("bioPortal/getDatasets");
    },
    methods: {}
}).$mount("#app");
