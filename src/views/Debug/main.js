import Vue from "vue";

import BootstrapVue from "bootstrap-vue";
import Template from "./Template.vue";
import store from "./store.js";

import userUtils from "@/utils/userUtils";
Vue.use(BootstrapVue);
Vue.config.productionTip = false;

new Vue({
    store,
    components: {},

    created() {},

    render(createElement) {
        return createElement(Template);
    },

    data() {
        return {
            test: { id: "", name: "" },
            store: {}
        };
    },
    methods: {
        add() {
            userUtils.addPhenotype(this.test);
        },
        get() {
            this.store = userUtils.getPhenotypes();
        },
        clear() {
            userUtils.clearPhenotypes();
        },
        remove(item) {
            userUtils.removePhenotype(item);
        }
    },
    created() {},
    mounted() {}
}).$mount("#app");
