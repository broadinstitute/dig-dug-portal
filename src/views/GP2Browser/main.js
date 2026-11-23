import { mountPage } from "@/utils/pageSetup";
import Template from "./Template.vue";
import store from "./store.js";

import GP2Browser from "@/components/researchPortal/customComponents/GP2Browser.vue";

import uiUtils from "@/utils/uiUtils";
import plotUtils from "@/utils/plotUtils";
import sortUtils from "@/utils/sortUtils";
import alertUtils from "@/utils/alertUtils";
import Formatters from "@/utils/formatters";
import dataConvert from "@/utils/dataConvert";
import keyParams from "@/utils/keyParams";
import filterUtils from "@/utils/filterUtils";
import regionUtils from "@/utils/regionUtils";
import userUtils from "@/utils/userUtils.js";

// @vue/component
mountPage(Template, {
    store,
    components: {
        GP2Browser,
    },
    data() {
        return {
            sectionConfigs: {},
        };
    },
    computed: {
        utilsBox() {
            return {
                Formatters,
                uiUtils,
                alertUtils,
                keyParams,
                dataConvert,
                sortUtils,
                plotUtils,
                filterUtils,
                regionUtils,
                userUtils,
            };
        },
        phenotypesInSession() {
            if (this.$store.state.phenotypesInSession == null) {
                return this.$store.state.bioPortal.phenotypes;
            }
            return this.$store.state.phenotypesInSession;
        },
    },
    created() {
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("bioPortal/getDatasets");
    },
});
