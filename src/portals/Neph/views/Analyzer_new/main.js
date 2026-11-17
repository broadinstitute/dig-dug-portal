import Vue from "vue";
import Template from "./Template.vue";
import store from "../KrShared/store";
import "./style.css";

import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import { CheckSignInStatus } from "@/portals/Neph/components/LoginComponent.js";

Vue.config.productionTip = false;
Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);

new Vue({
    store,
    created() {
        this.CheckSignInStatus();
        this.$store.dispatch("bioPortal/getDiseaseGroups");
    },
    computed: {
        frontContents() {
            let contents = this.$store.state.kp4cd.frontContents;
            return contents.length === 0 ? {} : contents[0];
        },
        diseaseGroup() {
            return this.$store.getters["bioPortal/diseaseGroup"];
        }
    },
    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        }
    },
    methods: {
        CheckSignInStatus
    },
    render(createElement) {
        return createElement(Template);
    }
}).$mount("#app");
