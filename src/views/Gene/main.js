import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';

Vue.config.productionTip = false;
Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);

new Vue({
    store,

    components: {

    },
    data: {

    },

    created() {

    },

    render(createElement, context) {
        return createElement(Template);
    },

    computed: {
        uniprotData() {
            return this.$store.state.uniprot.data;
        },
    },

    watch: {

    }
}).$mount("#app");
