import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';
import LocusZoom from "@/components/LocusZoom";

Vue.config.productionTip = false;
Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);

new Vue({
    store,
    created() {
        // NOTE: this should work on gene page: http://localhost:8090/gene.html?chrom=8&end=118188953&gene=&phenotype=t2d&start=117962512
        this.$store.dispatch('associations/query' , { q: 't2d,8:117962512-118188953' });
        this.$store.dispatch('phenotypeAssociations/query' , { q: 't2d' });
        this.$store.dispatch('topAssociations/query' , { q: '8:117962512-118188953' });
    },
    components: {
        LocusZoom,
    },
    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
