import Vue from "vue";
import Template from "./Template.vue";

new Vue({
    components: {
    },
    data() {
        return {};
    },
    computed: {},
    watch: {},
    created() {},

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
