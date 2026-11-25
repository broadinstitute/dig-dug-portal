import { mountPage } from "@/utils/pageSetup";
import Template from "./Template.vue";
import store from "./store.js";

import uiUtils from "@/utils/uiUtils";
import { pageMixin } from "@/mixins/pageMixin.js";

// @vue/component
mountPage(Template, {
    store,
    mixins: [pageMixin],

    computed: {
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

    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getDiseaseSystems");
        this.$store.dispatch("bioPortal/getPhenotypes");
    },

    methods: {
        ...uiUtils,
    },
});
