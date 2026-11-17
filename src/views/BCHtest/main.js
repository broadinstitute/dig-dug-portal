import Vue from "vue";
import Template from "./Template.vue";
//import store from "./store.js";
//import { pageMixin } from "@/mixins/pageMixin";
//import { match, query } from "@/utils/bioIndexUtils";
import bchtest from "@/components/BCHtest.vue";
Vue.config.productionTip = false;

new Vue({
    components: { bchtest }
}).$mount("#app");
