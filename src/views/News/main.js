import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import PortalDatasetsListTable from "@/components/PortalDatasetsListTable.vue";
import NewFeatures from "@/components/NewFeatures.vue";
import keyParams from "@/utils/keyParams";
import { pageMixin } from "@/mixins/pageMixin.js";

new Vue({
    store,
    components: {
        NewFeatures,
        PortalDatasetsListTable,
    },
    mixins: [pageMixin],
    computed: {
        newFeatures() {
            let contents = this.$store.state.kp4cd.newFeatures;

            if (contents.length === 0) {
                return {};
            }
            return contents;
        },

        nid() {
            let content = keyParams.nid;
            return content;
        },
        diseaseInSession() {
            if (this.$store.state.diseaseInSession == null) {
                return "";
            } else {
                return this.$store.state.diseaseInSession;
            }
        },
        phenotypesInSession() {
            if (this.$store.state.phenotypesInSession == null) {
                return this.$store.state.bioPortal.phenotypes;
            } else {
                return this.$store.state.phenotypesInSession;
            }
        },
        rawPhenotypes() {
            return this.$store.state.bioPortal.phenotypes;
        },
    },

    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
            this.$store.dispatch("kp4cd/getNewFeatures", group.name);
        },
    },

    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getDiseaseSystems");
        this.$store.dispatch("bioPortal/getPhenotypes");
    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
