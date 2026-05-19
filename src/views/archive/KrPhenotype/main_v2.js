import Vue from "vue";
import Template from "./Template_v2.vue";
import store from "./store.js";
import { pageMixin } from "@/mixins/pageMixin";

Vue.config.productionTip = false;

new Vue({
    store,
    mixins: [pageMixin],
    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
    },
    render(createElement) {
        return createElement(Template);
    },
}).$mount("#app");
