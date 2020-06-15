import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import Template from "./Template.vue";
import store from "./store.js";

Vue.use(BootstrapVue);
Vue.config.productionTip = false;

new Vue({
    store,

    components: {
        PageHeader,
        PageFooter
    },
    render(createElement, context) {
        return createElement(Template);
    },
    methods: {},
    computed: {}
}).$mount("#app");
