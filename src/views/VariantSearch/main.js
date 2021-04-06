import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";
import { pageMixin } from "@/mixins/pageMixin";
import VariantSearch from "@/components/VariantSearch";
Vue.config.productionTip = false;

new Vue({
    store,
    mixins: [pageMixin],

    components: { VariantSearch },

    data() {
        return {};
    },
    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("bioPortal/getDatasets");
    },

    render(createElement, context) {
        return createElement(Template);
    }
}).$mount("#app");
