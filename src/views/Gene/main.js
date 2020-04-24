import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';

import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";



Vue.config.productionTip = false;
Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);

new Vue({
    store,
<<<<<<< HEAD
    modules: {

    },
=======
>>>>>>> master
    components: {
        PageHeader,
        PageFooter,
    },
    data: {

    },

    created() {
        this.$store.dispatch('queryGene');
        // get the disease group and set of phenotypes available
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");

    },

    render(createElement, context) {
        return createElement(Template);
    },

    data() {
        return {
            counter: 0,
        }
    },

    methods: {
    },

    computed: {
        frontContents() {
            let contents = this.$store.state.kp4cd.frontContents;

            if (contents.length === 0) {
                return {};
            }
            return contents[0];
        },

        diseaseGroup() {
            return this.$store.getters['bioPortal/diseaseGroup'];
        },

        phenotypes() {
            return this.$store.state.bioPortal.phenotypes;
        },
        uniprotData() {
            return this.$store.state.uniprot.data;
        },
        geneData() {
            let data = this.$store.state.geneName.data
            if (data.length > 0) {
                return data[0]
            }
            return {}
        },
    },

    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },

    }
}).$mount("#app");
