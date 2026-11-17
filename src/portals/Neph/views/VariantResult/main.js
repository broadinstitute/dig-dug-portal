import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";
import { pageMixin } from "@/mixins/pageMixin";
import { CheckSignInStatus } from "@/portals/Neph/components/LoginComponent.js";

Vue.config.productionTip = false;

new Vue({
    store,
    mixins: [pageMixin],
    created() {
        this.CheckSignInStatus();
        this.$store.dispatch("bioPortal/getDiseaseGroups");
    },
    methods: {
        CheckSignInStatus
    },
    render(createElement) {
        return createElement(Template);
    }
}).$mount("#app");
