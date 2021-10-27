import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

Vue.config.productionTip = false;

//Bootstrap components and css styles
import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
Vue.use(BootstrapVue);
Vue.use(IconsPlugin);
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

//Components
import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import Alert, {
    postAlert,
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";

//Utilities
import uiUtils from "@/utils/uiUtils";

//Modules

new Vue({
    store,

    components: {
        PageHeader,
        PageFooter,
        Alert,
    },
    data() {
        return {

        }
    },

    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
    },

    render(createElement, context) {
        return createElement(Template);
    },

    methods: {
        ...uiUtils,
        postAlert,
        postAlertNotice,
        postAlertError,
        closeAlert
    },

    computed: {

        featureConfiguration() {
            let configContent = {
                "default": {
                    "pageTitle": "Page default title",
                    "features": ["feature1", "feature2", "feature3", "feature4"]
                },
                "md.configuration.html": {
                    "pageTitle": "Page feature cofiguration: proof of concept",
                    "features": ["feature1", "feature2", "feature3", "feature10"],
                    "featureConfigOverride": {
                        "feature1": { "pHtml": "Feature 1 param overridden." }
                    }
                }
            };

            if (!!this.diseaseGroup) {
                let path = this.diseaseGroup.name + "." + window.location.pathname.substring(1);

                if (!!configContent[path]) {
                    return configContent[path];
                } else {
                    return configContent["default"];
                }
            } else {
                return null;
            }
        },

        diseaseGroup() {
            return this.$store.getters["bioPortal/diseaseGroup"];
        },

        frontContents() {
            let contents = this.$store.state.kp4cd.frontContents;

            if (contents.length === 0) {
                return {};
            }
            return contents[0];
        },


        pageTitle() {
            if (this.featureConfiguration != null) {
                return this.featureConfiguration.pageTitle;
            }
        },
    },

    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);

            let pageFeatures = this.featureConfiguration.features;
            pageFeatures.map(f => {
                var featureWrapper = document.createElement("div");
                featureWrapper.className = "card mdkp-card";
                var feature = document.getElementById(f);
                featureWrapper.appendChild(feature);
                document.getElementById("page_features_wrapper").appendChild(featureWrapper);
            });

            let featureCollectionWrapper = document.getElementById('collectionOfFeatures');
            featureCollectionWrapper.remove();

        },
    }
}).$mount("#app");
