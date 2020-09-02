import Vue from "vue";
import Template from "./Template.vue";
Vue.config.productionTip = false;
new Vue({
    render(createElement, context) {
        return createElement(Template);
    }
}).$mount("#app");
