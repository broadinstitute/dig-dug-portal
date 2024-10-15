import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";
import Resources from "@/components/Resources.vue";
import keyParams from "@/utils/keyParams";
import { pageMixin } from "@/mixins/pageMixin.js";

new Vue({
    store,
    components: {
        Resources,
    },
    mixins: [pageMixin],
    computed: {
        resources() {
            let contents = this.$store.state.kp4cd.resources;

            if (contents.length === 0) {
                return {};
            }
            return contents;
        },

        nid() {
            let content = keyParams.resource;
            return content;
        },
    },

    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
            this.$store.dispatch("kp4cd/getResources", group.name);
        },
    },

    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
