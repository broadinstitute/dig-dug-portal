import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import Template from "./Template.vue";
import store from "./store.js";
import '../assets/styles.css';

Vue.use(BootstrapVue);
Vue.config.productionTip = false;

import matkpNav from "../components/matkp-nav.vue"
import matkpHero from "../components/matkp-hero.vue"
import matkpFooter from "../components/matkp-footer.vue"
import * as d3 from "d3";
import Formatters from "@/utils/formatters";
import uiUtils from "@/utils/uiUtils";

new Vue({
    store,

    components: {
        matkpHero,
        matkpNav,
        matkpFooter
    },

    data() {
        return{

        }
    },

    watch: {

    },

    computed: {
    },

    mounted() {
    },

    async created() {
    },

    render(createElement, context) {
        return createElement(Template);
    },

    methods: {

    },
}).$mount("#app");
