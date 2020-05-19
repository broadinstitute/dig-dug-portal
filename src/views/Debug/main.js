import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';

import IGV from "@/components/IGV";
import LoadingBar from "@/components/LoadingBar";

import PageHeader from "@/components/PageHeader";
import PageFooter from "@/components/PageFooter";
import PhenotypeSelectPicker from "../../components/PhenotypeSelectPicker";
import { useTranslations, associationsForIGV, translate, associationsFromVariants } from "@/utils/dataMappingUtils";

import Alert, {
    postAlert,
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";

import GAEventLog from "@/components/GAEventLog";

Vue.config.productionTip = false;
Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);

new Vue({
    store,

    components: {
        PageHeader,
        PageFooter,
        PhenotypeSelectPicker,
        LoadingBar,
        IGV,
        Alert,
        GAEventLog
    },

    render(createElement, context) {
        return createElement(Template);
    },

    methods: {
        //...useTranslations,
        //associationsForIGV,
        //associationsForIGVFromVariants: translate({ from: associationsFromVariants, to: associationsForIGV}),
        postAlert,
        postAlertNotice,
        postAlertError,
        closeAlert,
        pause: () => console.log('hello'),
        forceError: () => {
            null.hello()
            throw new Error("error");
        }
    },

    computed: {
        variantData() {
            return this.$store.state.topAssociations.data;
        },

        topAssociations() {
            let top = {};

            this.variantData.forEach(v => {
                let p = v.phenotype;

                if (!top[p] || v.pValue < top[p].pValue) {
                    top[p] = v;
                }
            });

            let associations = Object.values(top);
            associations.sort((a, b) => a.pValue - b.pValue);

            return associations;
        },

        percentComplete() {
            return this.$store.getters['topAssociations/percentComplete'];
        }
    },

}).$mount("#app");
