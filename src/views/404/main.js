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
        links() {
            return this.$store.state.bioPortal.links;
        }
    },
    watch: {
        links(links) {
            console.log(links);
            console.log(window.location.pathname);

            if (links) {
                let oldLink = window.location.pathname;
                let foundLink = links.find(link => link.path == oldLink);

                console.log(foundLink);

                if (!!foundLink) {
                    window.location.href = foundLink.redirect;
                }
            }
        }
    }
}).$mount("#app");
