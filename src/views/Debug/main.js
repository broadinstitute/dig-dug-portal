import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';
import LocusZoomOld from "./LocusZoom/LocusZoomOld";

Vue.config.productionTip = false;
Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);

new Vue({
    store,

    components: {
        LocusZoomOld,
    },
    data: {

    },

    created() {
    },

    computed: {

    },

    watch: {

    },

    render(createElement, context) {
        return createElement(Template);
    },

}).$mount("#app");
