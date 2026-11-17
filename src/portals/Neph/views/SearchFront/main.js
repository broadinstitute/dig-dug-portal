import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import Template from "./Template.vue";
import store from "./store.js";

Vue.use(BootstrapVue);
Vue.config.productionTip = false;

import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import uiUtils from "@/utils/uiUtils";

import { CheckSignInStatus } from "@/portals/Neph/components/LoginComponent.js";

new Vue({
    store,
    components: {
        PageHeader,
        PageFooter,
    },
    created() {
        this.CheckSignInStatus();
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("bioPortal/getDatasets");
    },
    render(createElement) {
        return createElement(Template);
    },
    methods: {
        ...uiUtils,
        CheckSignInStatus,
    },
    computed: {
        diseaseGroup() {
            return this.$store.getters["bioPortal/diseaseGroup"];
        },
        frontContents() {
            let contents = this.$store.state.kp4cd.frontContents;
            if (!contents || contents.length === 0) {
                return {};
            }
            return contents[0];
        }
    },
    watch: {
        diseaseGroup(group) {
            if (group) {
                this.$store.dispatch("kp4cd/getNewsFeed", group.name);
                this.$store.dispatch("kp4cd/getFrontContents", group.name);
                this.$store.dispatch("kp4cd/getDatasetsInfo", group.name);
            }
        }
    }
}).$mount("#app");
