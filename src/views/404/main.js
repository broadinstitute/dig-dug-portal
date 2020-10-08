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
        //get links for redirects
        this.$store.dispatch("bioPortal/getLinks");

        // get the disease group and set of phenotypes available
        this.$store.dispatch("bioPortal/getDiseaseGroups");
    },
    mounted() {
        //if new link is found, go there indstead of displaying this page
        this.lookUpNewLink();
    },
    render(createElement) {
        return createElement(Template);
    },
    methods: {
        lookUpNewLink() {
            if (this.links) {
                let oldLink = this.currentPath;
                let found = this.links.path.indexOf(oldLink);

                if (found != -1)
                    window.location.href = this.links.redirect[found];
            }
        }
    },
    computed: {
        currentPath() {
            return window.location.pathname;
        },
        links() {
            return this.$store.state.links;
        }
    }
}).$mount("#app");
