import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import Template from "./Template.vue";
import store from "./store.js";

import FilterGroup from "@/components/Filter/FilterGroup.vue";
import FilterControl from "@/components/Filter/FilterControl.vue";
import FilterPValue from "@/components/Filter/FilterPValue.vue";
import FilterEnumeration from "@/components/Filter/FilterEnumeration.vue";
import FilterGreaterThan from "@/components/Filter/FilterGreaterThan.vue";

import { pageMixin } from "@/mixins/pageMixin";

Vue.use(BootstrapVue);
Vue.config.productionTip = false;

new Vue({
    store,
    mixins: [pageMixin],
    components: {
        FilterGroup,
        FilterControl,
        FilterPValue,
        FilterEnumeration,
        FilterGreaterThan
    },
    render(createElement, context) {
        return createElement(Template);
    },
    data() {
        return {
            auto_select: true,
            set_covariates: false
        };
    },
    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("bioPortal/getDatasets");
    },
    methods: {}
}).$mount("#app");
