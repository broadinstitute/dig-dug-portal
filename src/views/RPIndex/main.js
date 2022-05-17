import Vue from "vue";
import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

Vue.use(BootstrapVueIcons);
import Template from "./Template.vue";
import store from "./store.js";

Vue.use(BootstrapVue);
Vue.config.productionTip = false;


new Vue({
    store,

    data: {

    },

    components: {

    },

    created() {

    },

    render(createElement, context) {
        return createElement(Template);
    },

    methods: {

    },

    computed: {

    },

    watch: {

    }
}).$mount("#app");
