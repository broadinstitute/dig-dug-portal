import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";


Vue.config.productionTip = false;

new Vue({
    store,

    components: {

    },
    data: {

    },

    created() {
        this.$store.dispatch("bioIndexAssociations/count", {q: 'slc30a8'});
        this.$store.dispatch("bioIndexAssociations/query", {q: 'slc30a8', cont: true});
    },

    render(createElement, context) {
        return createElement(Template);
    },

    computed: {
        variantData() {
            return this.$store.state.bioIndexAssociations.data;
        },

        percentComplete() {
            return this.$store.getters['bioIndexAssociations/percentComplete'];
        }
    },

    watch: {

    }
}).$mount("#app");
