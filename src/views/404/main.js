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
        //get links for redirects
        this.$store.dispatch("bioPortal/getLinks");

        // get the disease group and set of phenotypes available
        this.$store.dispatch("bioPortal/getDiseaseGroups");
    },
    render(createElement) {
        return createElement(Template);
    },
    computed: {
        currentPath() {
            return window.location.pathname;
        },
        links() {
            return this.$store.state.bioPortal.links;
        },
        redirectLink() {
            if (this.links) {
                let oldLink = this.currentPath;
                let foundLink = this.links.find(link => link.path == oldLink);

                if (!!foundLink) {
                    return foundLink.redirect;
                }
            }
        }
    },
    watch: {
        redirectLink(href) {
            if (!!href) {
                window.location.href = href;
            }
        }
    }
}).$mount("#app");
