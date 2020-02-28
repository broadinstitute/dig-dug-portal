import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';

import LoadingBar from "../../components/LoadingBar/LoadingBar";

Vue.config.productionTip = false;
Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);

new Vue({
    store,

    components: {
        "loading-bar": LoadingBar
    },
    data: {

    },

    created() {
        this.$store.dispatch("associations/count", { q: 'slc30a8' })
        this.$store.dispatch("associations/query", { q: 'slc30a8' })
    },

    render(createElement, context) {
        return createElement(Template);
    },

    computed: {
        variantData() {
            return this.$store.state.topAssociations.data;
        },

        topAssociations() {
            let top = {};

            this.variantData.forEach(v => {
                let p = v.phenotype;

                if (!top[p] || v.pValue < top[p].pValue) {
                    top[p] = v;
                }
            });

            let associations = Object.values(top);
            associations.sort((a, b) => a.pValue - b.pValue);

            return associations;
        },

        percentComplete() {
            return this.$store.getters['topAssociations/percentComplete'];
        }
    },

    watch: {

    }
}).$mount("#app");
