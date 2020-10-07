import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import Alert from "@/components/Alert";
import { pageMixin } from "@/mixins/pageMixin";
import parseUrl from "url-parse";

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
        //call function to check db for new links
        console.log("created1", window.location.href);
        console.log("created2", window.location.pathname);

        // get the disease group and set of phenotypes available
        this.$store.dispatch("bioPortal/getDiseaseGroups");
    },
    render(createElement) {
        return createElement(Template);
    },
    methods: {
        lookUpNewLink() {
            let oldLink = window.location.href;
            // check DB
            let newLink = "";
            window.location.href = newLink;
        }
    }
}).$mount("#app");
