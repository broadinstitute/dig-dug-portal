import Vue from "vue";
import Template from "./Template.vue";

import store from "./store.js";
import vsm from "vue-state-machine";

import {BootstrapVue} from "bootstrap-vue";
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';

Vue.config.productionTip = false;
Vue.use(BootstrapVue);
Vue.use(vsm.plugin, store);

new Vue({
    store,

    components: {

    },
    data: {

    },

    created() {
        this.$store.dispatch("associations/count", { q: 'slc30a8' });
        this.$store.dispatch("associations/queryGen", { q: 'slc30a8' });
        // this.$store.dispatch("associations/query", { q: 'slc30a8', cont: true });
        // this.$store.dispatch("topAssociations/queryGen", { q: 'slc30a8', cont: true });
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
