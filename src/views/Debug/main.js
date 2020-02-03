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
        this.$store.dispatch("kp4cd/getNewsFeed");
        this.$store.dispatch("kp4cd/getFrontContents");
        this.$store.dispatch("kp4cd/getDatasetsInfo");
    },

    render(createElement, context) {
        return createElement(Template);
    },

    computed: {

    },

    watch: {

    }
}).$mount("#app");
