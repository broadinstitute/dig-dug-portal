import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import Documentation from "@/components/Documentation.vue";
import { pageMixin } from "@/mixins/pageMixin";

Vue.config.productionTip = false;

new Vue({
    store,
    mixins: [pageMixin],
    components: {
        Documentation
    },
    render(createElement, context) {
        return createElement(Template);
    },
    data() {
        return {};
    },
    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("bioPortal/getDatasets");
        //this.initCriteria();
    },
    computed: {},
    methods: {},
    watch: {}
}).$mount("#app");
