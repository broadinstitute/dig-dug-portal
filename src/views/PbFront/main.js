import Vue from "vue";
import Template from "./Template.vue";

Vue.config.productionTip = false;

new Vue({
    render(createElement) {
        return createElement(Template);
    },
}).$mount("#app");
