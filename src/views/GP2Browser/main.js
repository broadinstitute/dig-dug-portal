import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import GP2Browser from "@/components/researchPortal/customComponents/GP2Browser.vue";

import uiUtils from "@/utils/uiUtils";
import plotUtils from "@/utils/plotUtils";
import sortUtils from "@/utils/sortUtils";
import alertUtils from "@/utils/alertUtils";
import Formatters from "@/utils/formatters";
import dataConvert from "@/utils/dataConvert";
import keyParams from "@/utils/keyParams";
import filterUtils from "@/utils/filterUtils";
import regionUtils from "@/utils/regionUtils";
import userUtils from "@/utils/userUtils.js";

Vue.config.productionTip = false;
Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);

new Vue({
    store,
    components: {
        GP2Browser,
    },
    data() {
        return {
            sectionConfigs: {},
        };
    },
    computed: {
        utilsBox() {
            return {
                Formatters,
                uiUtils,
                alertUtils,
                keyParams,
                dataConvert,
                sortUtils,
                plotUtils,
                filterUtils,
                regionUtils,
                userUtils,
            };
        },
        phenotypesInSession() {
            if (this.$store.state.phenotypesInSession == null) {
                return this.$store.state.bioPortal.phenotypes;
            }
            return this.$store.state.phenotypesInSession;
        },
    },
    created() {
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("bioPortal/getDatasets");
    },
    render(createElement) {
        return createElement(Template);
    },
}).$mount("#app");
