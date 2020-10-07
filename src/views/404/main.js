import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import Alert from "@/components/Alert";
import { pageMixin } from "@/mixins/pageMixin";

Vue.config.productionTip = false;

new Vue({
    store,
    mixins: [pageMixin],
    components: {
        PageHeader,
        PageFooter,
        Alert
    },
    created() {
        // get the disease group and set of phenotypes available
        this.$store.dispatch("bioPortal/getDiseaseGroups");
    },
    render(createElement) {
        return createElement(Template);
    }
}).$mount("#app");
