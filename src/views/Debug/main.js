import Vue from "vue";
import Template from "./Template.vue";
new Vue({
    data() {
        return {
            hello: "goodbye"
        }
    },
    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
