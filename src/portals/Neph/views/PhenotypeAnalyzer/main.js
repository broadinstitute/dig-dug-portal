import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import uiUtils from "@/utils/uiUtils";

import Alert, {
    postAlert,
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";

import { CheckSignInStatus } from "@/portals/Neph/components/LoginComponent.js";

Vue.config.productionTip = false;
Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);

new Vue({
    store,
    components: {
        PageHeader,
        PageFooter,
        Alert
    },

    created() {
        this.CheckSignInStatus();
        this.$store.dispatch("bioPortal/getDiseaseGroups");
    },

    render(createElement) {
        return createElement(Template);
    },

    methods: {
        ...uiUtils,
        postAlert,
        postAlertNotice,
        postAlertError,
        closeAlert,
        CheckSignInStatus,
        analyzePhenotypes() {
            this.$store.dispatch("analyzePhenotypes");
        }
    },

    computed: {
        frontContents() {
            let contents = this.$store.state.kp4cd.frontContents;
            if (contents.length === 0) {
                return {};
            }
            return contents[0];
        },
        diseaseGroup() {
            return this.$store.getters["bioPortal/diseaseGroup"];
        },
        formattedResult() {
            if (this.$store.state.result === null) {
                return "Submit phenotypes to view the response JSON here.";
            }
            return JSON.stringify(this.$store.state.result, null, 2);
        },
        topMatches() {
            let result = this.$store.state.result;
            if (!result || !Array.isArray(result.top_matches)) {
                return [];
            }
            return result.top_matches.map(match => {
                if (match !== null && typeof match === "object") {
                    return match;
                }
                return { value: match };
            });
        },
        topMatchFields() {
            let keys = this.topMatches.reduce((fields, match) => {
                Object.keys(match).forEach(key => fields.add(key));
                return fields;
            }, new Set());

            return Array.from(keys).map(key => ({
                key,
                label: key
            }));
        },
        isAnalyzeDisabled() {
            return (
                this.$store.state.loading ||
                this.$store.getters.normalizedTerms.length === 0
            );
        }
    },

    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        }
    }
}).$mount("#app");
