import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import PhenotypeSelect from "@/components/PhenotypeSelect.vue";
import DatasetSelect from "@/components/DatasetSelect.vue";

new Vue({
    store,

    components: {
        PhenotypeSelect,
        DatasetSelect,
    },

    created() {
        this.$store.dispatch("phenotypeModule/getPhenotypes");
    },

    render(createElement, context) {
        return createElement(Template);
    },

    watch: {
    }
}).$mount("#app");
