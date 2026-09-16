import Vue from "vue";
import Template from "./Template.vue";
import store from "./store";
import { pageMixin } from "@/mixins/pageMixin";

new Vue({
    store,
    mixins: [pageMixin],
    created() {
        // Local method content and the app remain usable when portal metadata is down.
        ["getDiseaseGroups", "getDiseaseSystems", "getPhenotypes"].forEach(
            (action) => {
                this.$store.dispatch(`bioPortal/${action}`).catch(() => {});
            }
        );
    },
    render: (createElement) => createElement(Template),
}).$mount("#app");
