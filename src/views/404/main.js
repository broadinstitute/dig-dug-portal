import Vue from "vue";
import Template from "./Template.vue";
import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";

Vue.config.productionTip = false;

new Vue({
    components: {
        PageHeader,
        PageFooter
    },
    render(createElement) {
        return createElement(Template);
    }
}).$mount("#app");
