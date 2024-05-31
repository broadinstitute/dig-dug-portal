import Vue from "vue";
import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import Template from "./Template.vue";
import store from "./store.js";

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import '../assets/styles.css';

Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);
Vue.config.productionTip = false;

import matkpNav from "../components/matkp-nav.vue"
import matkpHero from "../components/matkp-hero.vue"
import matkpFooter from "../components/matkp-footer.vue"
import * as d3 from "d3";
import Formatters from "@/utils/formatters";
import uiUtils from "@/utils/uiUtils";

//import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils"; 

const BIO_INDEX_HOST = 'https://bioindex-dev.hugeamp.org';

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

    methods: {
        
    },

    render(createElement, context) {
        return createElement(Template);
    },

    
}).$mount("#app");
