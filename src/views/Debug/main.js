import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';



import LocusZoom from "@/components/lz/LocusZoom";
import LocusZoomAssociationsPanel from "@/components/lz/panels/LocusZoomAssociationsPanel";
import LocusZoomPhewasPanel from "@/components/lz/panels/LocusZoomPhewasForestPanel";
import LocusZoomChild from "@/components/lz/panels/LocusZoomChild";

Vue.config.productionTip = false;
new Vue({
    store,

    components: {
        LocusZoom,
        LocusZoomAssociationsPanel,
        LocusZoomPhewasPanel,
    },

    render(createElement, context) {
        return createElement(Template);
    },

    methods: {

    },

    computed: {

    },

}).$mount("#app");
