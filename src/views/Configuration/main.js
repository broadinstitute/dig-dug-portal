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

        pageConfiguration() {
            let configContent = {
                "md.configuration.html": {
                    "pageTitle": "Page feature cofiguration: proof of concept",
                    "features": ["feature1", "feature2", "feature3", "feature4"]
                }
            };
            return configContent;
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
            if (!!this.diseaseGroup && !!this.pageConfiguration) {
                let path = this.diseaseGroup.name + "." + window.location.pathname.substring(1);

                return this.pageConfiguration[path].pageTitle;
            }
        },

        featuresConfigName() {
            return this.diseaseGroup.name + "." + window.location.pathname.substring(1);
        },
    },

    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);

            let featuresConfig = this.featuresConfigName;
            let pageFeatures = this.pageConfiguration[featuresConfig].features;
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
