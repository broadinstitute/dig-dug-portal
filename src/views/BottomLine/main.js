import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import StaticPageInfo from "@/components/StaticPageInfo.vue";
import uiUtils from "@/utils/uiUtils";
import { pageMixin } from "@/mixins/pageMixin.js";

new Vue({
    store,
    components: {
        StaticPageInfo,
    },
    mixins: [pageMixin],

    computed: {
        diseaseGroup() {
            return this.$store.getters["bioPortal/diseaseGroup"];
        },

        frontContents() {
            const contents = this.$store.state.kp4cd.frontContents;

            return contents.length ? contents[0] : {};
        },

        pageInfo() {
            const contents = this.$store.state.kp4cd.pageInfo;

            return contents.length ? contents : null;
        },

        rawPhenotypes() {
            return this.$store.state.bioPortal.phenotypes;
        },
    },

    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
            this.$store.dispatch("kp4cd/getPageInfo", {
                page: "bottomline",
                portal: group.name,
            });
        },
    },

    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getDiseaseSystems");
        this.$store.dispatch("bioPortal/getPhenotypes");
    },

    methods: {
        ...uiUtils,
    },

    render(createElement) {
        return createElement(Template);
    },
}).$mount("#app");
