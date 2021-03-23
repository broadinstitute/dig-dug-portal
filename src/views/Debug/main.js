import Vue from "vue";

import Template from "./Template.vue";
import store from "./store.js";


Vue.config.productionTip = false;
Vue.component("b-button", BButton);
Vue.use(BootstrapVueIcons);

new Vue({
    store,
    components: {
    },

    async created() {
    },

    render(createElement) {
        return createElement(Template);
    },

    data() {
        return {
        };
    },

    methods: {
    },

    computed: {
    },
    watch: {
    }
}).$mount("#app");
