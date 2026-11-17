import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";
import { pageMixin } from "@/mixins/pageMixin";

Vue.config.productionTip = false;
document.documentElement.classList.add("pb-gene2-default-scale");

// Open on a gene when the URL names none.
const initialUrl = new URL(window.location.href);
if (!String(initialUrl.searchParams.get("query") || "").trim()) {
    initialUrl.searchParams.set("query", "GJB2");
    window.history.replaceState({}, "", initialUrl.toString());
}

// Data comes from the pbGene store (store.js): BioIndex gene / gene-samples /
// gene-hpo15 plus the phenotype analyzer service's gene-variants-crdc.
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
