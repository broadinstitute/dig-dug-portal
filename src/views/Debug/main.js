import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import ElementList from "@/components/igv/ElementList.vue"
import Grid from "@/components/igv/Grid.vue"

Vue.config.productionTip = false;

new Vue({
    store,

    components: {
        ElementList,
        Grid,
    },

    data() {
        return {
            nums: 3,
        }
    },

    render(createElement, context) {
        return createElement(Template);
    },

}).$mount("#app");
