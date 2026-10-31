import Vue from "vue";
import Template from "./Template.vue";
import store from "../PbGene/store.js";
import { pageMixin } from "@/mixins/pageMixin";

Vue.config.productionTip = false;

// Gene2's default is independent of the original Gene page.
const initialUrl = new URL(window.location.href);
if (!String(initialUrl.searchParams.get("query") || "").trim()) {
    initialUrl.searchParams.set("query", "GJB2");
    window.history.replaceState({}, "", initialUrl.toString());
}

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
